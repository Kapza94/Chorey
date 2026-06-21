// Pure glue for uploading a chore-completion photo. The child isn't an
// authenticated Supabase user, so the bytes go to the `chore-photos` edge
// function (service role) which validates the access code — see
// supabase/functions/chore-photos. Kept free of `react-native` /
// `expo-image-picker` so it stays unit-testable with a stub client.

type FunctionsClient = {
  functions: {
    invoke(
      name: string,
      opts: { body: Record<string, unknown> },
    ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
  };
};

export function createChildPhotoActions(client: FunctionsClient) {
  return {
    async uploadChorePhoto(input: {
      accessCode: string;
      choreId: string;
      imageBase64: string;
    }): Promise<void> {
      const { error } = await client.functions.invoke("chore-photos", {
        body: {
          action: "upload",
          access_code: input.accessCode,
          chore_id: input.choreId,
          image_base64: input.imageBase64,
        },
      });

      if (error) {
        throw new Error(error.message || "Photo upload failed.");
      }
    },
  };
}
