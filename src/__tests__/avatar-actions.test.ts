import { base64ToBytes, createAvatarActions } from "@/features/account/avatar-actions";

describe("base64ToBytes", () => {
  it("decodes base64 to the correct bytes", () => {
    // "Man" / "Ma" / "M" — the classic RFC 4648 examples.
    expect(Array.from(base64ToBytes("TWFu"))).toEqual([77, 97, 110]);
    expect(Array.from(base64ToBytes("TWE="))).toEqual([77, 97]);
    expect(Array.from(base64ToBytes("TQ=="))).toEqual([77]);
  });

  it("ignores whitespace/newlines from picker output", () => {
    expect(Array.from(base64ToBytes("TW\nFu"))).toEqual([77, 97, 110]);
  });
});

describe("createAvatarActions", () => {
  it("uploads an ArrayBuffer to a versioned path, records it, deletes the old one", async () => {
    const upload = jest.fn().mockResolvedValue({ error: null });
    const remove = jest.fn().mockResolvedValue({ error: null });
    const getPublicUrl = jest.fn((path: string) => ({
      data: { publicUrl: `https://cdn.test/${path}` },
    }));
    const upsert = jest.fn().mockResolvedValue({ error: null });

    const client = {
      storage: { from: () => ({ upload, remove, getPublicUrl }) },
      from: () => ({ upsert }),
    };

    const url = await createAvatarActions(client as never).uploadAvatar({
      userId: "user-1",
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "image/jpeg",
      previousPath: "user-1/avatar-111.jpg",
    });

    // ArrayBuffer body (Uint8Array doesn't serialize in RN); versioned filename.
    const [path, body, opts] = upload.mock.calls[0];
    expect(path).toMatch(/^user-1\/avatar-\d+\.jpg$/);
    expect(body).toBeInstanceOf(ArrayBuffer);
    expect(opts).toEqual({ contentType: "image/jpeg", upsert: true });

    expect(upsert).toHaveBeenCalledWith(
      { id: "user-1", avatar_path: expect.stringMatching(/^user-1\/avatar-\d+\.jpg$/) },
      { onConflict: "id" },
    );
    // Old object cleaned up; URL is the unique new path (no ?v needed).
    expect(remove).toHaveBeenCalledWith(["user-1/avatar-111.jpg"]);
    expect(url).toMatch(/^https:\/\/cdn\.test\/user-1\/avatar-\d+\.jpg$/);
    expect(url).not.toContain("?v=");
  });

  it("skips cleanup when there is no previous avatar", async () => {
    const remove = jest.fn();
    const client = {
      storage: {
        from: () => ({
          upload: jest.fn().mockResolvedValue({ error: null }),
          remove,
          getPublicUrl: (p: string) => ({ data: { publicUrl: `https://cdn.test/${p}` } }),
        }),
      },
      from: () => ({ upsert: jest.fn().mockResolvedValue({ error: null }) }),
    };

    await createAvatarActions(client as never).uploadAvatar({
      userId: "user-1",
      bytes: new Uint8Array([1]),
      contentType: "image/png",
      previousPath: null,
    });

    expect(remove).not.toHaveBeenCalled();
  });

  it("throws when the upload fails (so the UI can surface it)", async () => {
    const client = {
      storage: {
        from: () => ({
          upload: jest.fn().mockResolvedValue({ error: new Error("nope") }),
          remove: jest.fn(),
          getPublicUrl: jest.fn(),
        }),
      },
      from: () => ({ upsert: jest.fn() }),
    };

    await expect(
      createAvatarActions(client as never).uploadAvatar({
        userId: "user-1",
        bytes: new Uint8Array([1]),
        contentType: "image/png",
      }),
    ).rejects.toThrow("nope");
  });
});
