import { createChildPhotoActions } from "@/features/chores/child-photo-actions";

function clientReturning(error: { message: string } | null) {
  const invoke = jest.fn(async () => ({ data: error ? null : { ok: true }, error }));
  return { client: { functions: { invoke } }, invoke };
}

describe("createChildPhotoActions.uploadChorePhoto", () => {
  it("invokes the chore-photos function with the upload action payload", async () => {
    const { client, invoke } = clientReturning(null);

    await createChildPhotoActions(client).uploadChorePhoto({
      accessCode: "CHOREY-AB12CD34",
      choreId: "chore-1",
      imageBase64: "aGVsbG8=",
    });

    expect(invoke).toHaveBeenCalledWith("chore-photos", {
      body: {
        action: "upload",
        access_code: "CHOREY-AB12CD34",
        chore_id: "chore-1",
        image_base64: "aGVsbG8=",
      },
    });
  });

  it("throws with the function's error message when the upload fails", async () => {
    const { client } = clientReturning({ message: "Invalid access code." });

    await expect(
      createChildPhotoActions(client).uploadChorePhoto({
        accessCode: "CHOREY-AB12CD34",
        choreId: "chore-1",
        imageBase64: "aGVsbG8=",
      }),
    ).rejects.toThrow("Invalid access code.");
  });
});
