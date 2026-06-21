// Chore-completion photos. Two actions on one function:
//
//   upload  — a child (anon, identified by access code) uploads one photo for a
//             chore they submitted. We validate the code, confirm the chore is
//             theirs, then store it at `<household_id>/<chore_id>.jpg` and stamp
//             chore_instances.photo_path / photo_uploaded_at. Children are not
//             authenticated Supabase users, so this is the ONLY write path —
//             the bucket has no anon write policy.
//
//   purge   — deletes photos older than 30 days and clears their photo_path.
//             Called on a cron, authorized with a Vault token (see README).
//
// Deploy with verify_jwt off: the upload path authenticates with the child's
// access code (kids aren't Supabase users) and the purge path with a token kept
// in Supabase Vault, so neither relies on a platform JWT.

import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = "chore-photos";
const RETENTION_DAYS = 30;
const MAX_BYTES = 5 * 1024 * 1024;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Constant-time string compare for the purge token (no early-exit on mismatch).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Detect the real image type from magic bytes. We never trust the caller's
// claimed type — only jpeg/png/webp (the bucket's allowed types) are accepted.
function sniffMime(b: Uint8Array): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return "image/jpeg";
  }
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return "image/png";
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

// base64 (no data: prefix) -> bytes + detected mime. The raw string is bounded
// BEFORE atob so an oversized body can't force a huge in-memory decode, then the
// decoded size is checked against the bucket limit.
function decodeImage(base64: string): { bytes: Uint8Array; mime: string } {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  // 4 base64 chars -> 3 bytes; reject early with a little slack for padding.
  if (clean.length > Math.ceil(MAX_BYTES / 3) * 4 + 16) {
    throw new Error("Photo is too large.");
  }
  const binary = atob(clean);
  if (binary.length > MAX_BYTES) {
    throw new Error("Photo is too large.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const mime = sniffMime(bytes);
  if (!mime) {
    throw new Error("Unsupported image type.");
  }
  return { bytes, mime };
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing server env." }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let payload: {
    action?: string;
    access_code?: string;
    chore_id?: string;
    image_base64?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  // --- purge -------------------------------------------------------------
  if (payload.action === "purge") {
    // Authorized with a token kept in Supabase Vault. The cron sends it (read
    // from Vault inline); we read the same secret via a service-role-only RPC.
    // No secret to provision by hand.
    const { data: token, error: tokenErr } = await supabase.rpc(
      "chore_photos_purge_token",
    );
    const auth = req.headers.get("Authorization") ?? "";
    const expected = typeof token === "string" ? token : "";
    if (
      tokenErr ||
      !expected ||
      !(timingSafeEqual(auth, `Bearer ${expected}`) || timingSafeEqual(auth, expected))
    ) {
      return json({ error: "Unauthorized." }, 401);
    }

    const cutoff = new Date(
      Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: stale, error: selErr } = await supabase
      .from("chore_instances")
      .select("id, photo_path")
      .not("photo_path", "is", null)
      .lt("photo_uploaded_at", cutoff);
    if (selErr) return json({ error: selErr.message }, 500);

    const rows = stale ?? [];
    if (rows.length === 0) return json({ ok: true, purged: 0 });

    const paths = rows.map((r) => r.photo_path as string);
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove(paths);
    if (rmErr) return json({ error: rmErr.message }, 500);

    const { error: updErr } = await supabase
      .from("chore_instances")
      .update({ photo_path: null, photo_uploaded_at: null })
      .in(
        "id",
        rows.map((r) => r.id),
      );
    if (updErr) return json({ error: updErr.message }, 500);

    return json({ ok: true, purged: rows.length });
  }

  // --- upload ------------------------------------------------------------
  if (payload.action === "upload") {
    const { access_code, chore_id, image_base64 } = payload;
    if (!access_code || !chore_id || !image_base64) {
      return json({ error: "access_code, chore_id and image_base64 are required." }, 400);
    }

    // Validate the access code -> household + child (same path as the RPCs).
    const { data: resolved, error: resErr } = await supabase
      .rpc("resolve_child_access_code", { input_access_code: access_code })
      .maybeSingle();
    if (resErr) return json({ error: resErr.message }, 500);
    if (!resolved) return json({ error: "Invalid access code." }, 403);

    const householdId = resolved.household_id as string;
    const childProfileId = resolved.child_profile_id as string;

    // The chore must belong to this child AND still be open for a photo — a
    // photo goes with the just-submitted (or sent-back) work, never an already
    // approved chore (which would let a child overwrite evidence and keep
    // resetting the 30-day purge clock).
    const { data: chore, error: choreErr } = await supabase
      .from("chore_instances")
      .select("id, status")
      .eq("id", chore_id)
      .eq("child_profile_id", childProfileId)
      .maybeSingle();
    if (choreErr) return json({ error: choreErr.message }, 500);
    if (!chore) return json({ error: "Chore not found for this child." }, 403);
    if (chore.status !== "submitted" && chore.status !== "sent_back") {
      return json({ error: "This chore can't take a photo right now." }, 409);
    }

    let image: { bytes: Uint8Array; mime: string };
    try {
      image = decodeImage(image_base64);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "Bad image." }, 400);
    }

    const path = `${householdId}/${chore_id}.jpg`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, image.bytes, { contentType: image.mime, upsert: true });
    if (upErr) return json({ error: upErr.message }, 500);

    const { error: stampErr } = await supabase
      .from("chore_instances")
      .update({ photo_path: path, photo_uploaded_at: new Date().toISOString() })
      .eq("id", chore_id);
    if (stampErr) return json({ error: stampErr.message }, 500);

    return json({ ok: true, path });
  }

  return json({ error: "Unknown action." }, 400);
});
