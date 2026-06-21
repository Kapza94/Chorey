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
//             Called on a cron with the PURGE secret (see README).
//
// Deploy:  supabase functions deploy chore-photos --no-verify-jwt
// Secret:  supabase secrets set CHORE_PHOTOS_PURGE_AUTH=<random string also used
//          as the Authorization header on the purge cron call>

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

// base64 (no data: prefix) -> bytes, capped at MAX_BYTES.
function decodeImage(base64: string): Uint8Array {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(clean);
  if (binary.length > MAX_BYTES) {
    throw new Error("Photo is too large.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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
    const expected = Deno.env.get("CHORE_PHOTOS_PURGE_AUTH");
    if (!expected || req.headers.get("Authorization") !== expected) {
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

    // The chore must belong to this child (defense in depth — never trust the id).
    const { data: chore, error: choreErr } = await supabase
      .from("chore_instances")
      .select("id")
      .eq("id", chore_id)
      .eq("child_profile_id", childProfileId)
      .maybeSingle();
    if (choreErr) return json({ error: choreErr.message }, 500);
    if (!chore) return json({ error: "Chore not found for this child." }, 403);

    let bytes: Uint8Array;
    try {
      bytes = decodeImage(image_base64);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "Bad image." }, 400);
    }

    const path = `${householdId}/${chore_id}.jpg`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
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
