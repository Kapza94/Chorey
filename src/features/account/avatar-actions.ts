/**
 * Parent avatar upload. Pure (no React Native / Supabase imports) so it stays
 * unit-testable; default-avatar-actions wires the real client + image picker.
 *
 * Avatars live in the public `avatars` bucket at `<user_id>/avatar.<ext>`, and
 * the path is mirrored onto `profiles.avatar_path` so `getParentIdentity` can
 * prefer the uploaded photo over a provider-supplied one.
 */

const AVATAR_BUCKET = "avatars";

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Decode a base64 string to raw bytes without relying on atob/Buffer (absent in
 *  some RN runtimes). Ignores whitespace and padding. */
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const byteLength = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(byteLength);

  const idx = (c: string | undefined): number => {
    const i = c === undefined ? -1 : B64.indexOf(c);
    return i < 0 ? 0 : i;
  };

  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n =
      (idx(clean[i]) << 18) |
      (idx(clean[i + 1]) << 12) |
      (idx(clean[i + 2]) << 6) |
      idx(clean[i + 3]);
    if (p < byteLength) bytes[p++] = (n >> 16) & 255;
    if (p < byteLength) bytes[p++] = (n >> 8) & 255;
    if (p < byteLength) bytes[p++] = n & 255;
  }

  return bytes;
}

type AvatarStorageBucket = {
  // RN note: storage-js does not serialize a Uint8Array body reliably; uploads
  // MUST pass an ArrayBuffer. See uploadAvatar.
  upload(
    path: string,
    body: ArrayBuffer,
    options: { contentType: string; upsert: boolean },
  ): PromiseLike<{ error: Error | null }>;
  remove(paths: string[]): PromiseLike<{ error: Error | null }>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
};

type AvatarClient = {
  storage: { from(bucket: string): AvatarStorageBucket };
  from(table: string): {
    upsert(
      values: Record<string, unknown>,
      options: { onConflict: string },
    ): PromiseLike<{ error: Error | null }>;
  };
};

export function createAvatarActions(client: AvatarClient) {
  return {
    /**
     * Upload (or replace) the parent's avatar and record its path. The filename
     * is versioned (`avatar-<ts>.ext`) so its public URL changes on every
     * upload — that's what actually busts the CDN/image cache after a re-photo,
     * which a fixed name + `?v=` query does not. The previous object is deleted
     * to avoid orphans. Returns the new public URL.
     */
    async uploadAvatar(input: {
      userId: string;
      bytes: Uint8Array;
      contentType: string;
      /** the prior avatar_path to clean up, if any. */
      previousPath?: string | null;
    }): Promise<string> {
      const ext = input.contentType === "image/png" ? "png" : "jpg";
      const path = `${input.userId}/avatar-${Date.now()}.${ext}`;

      // Hand storage an ArrayBuffer (Uint8Array bodies don't serialize in RN).
      const buffer = input.bytes.buffer.slice(
        input.bytes.byteOffset,
        input.bytes.byteOffset + input.bytes.byteLength,
      ) as ArrayBuffer;

      const uploaded = await client.storage.from(AVATAR_BUCKET).upload(path, buffer, {
        contentType: input.contentType,
        upsert: true,
      });
      if (uploaded.error) {
        throw uploaded.error;
      }

      // Mirror the path onto the profile (only this column; display_name is left
      // untouched by the partial upsert).
      const profile = await client
        .from("profiles")
        .upsert({ id: input.userId, avatar_path: path }, { onConflict: "id" });
      if (profile.error) {
        throw profile.error;
      }

      // Best-effort cleanup of the replaced object; a failed delete is harmless.
      if (input.previousPath && input.previousPath !== path) {
        await client.storage.from(AVATAR_BUCKET).remove([input.previousPath]);
      }

      const { data } = client.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    },
  };
}

/** Public URL for a stored avatar path, or null when there is none. */
export function avatarPublicUrl(
  client: { storage: { from(bucket: string): { getPublicUrl(path: string): { data: { publicUrl: string } } } } },
  avatarPath: string | null | undefined,
): string | null {
  if (!avatarPath) {
    return null;
  }
  return client.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath).data.publicUrl;
}
