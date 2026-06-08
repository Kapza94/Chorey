type OAuthProvider = "apple" | "google";

type ParentAuthClient = {
  auth: {
    signInWithOAuth(args: {
      provider: OAuthProvider;
      options: {
        redirectTo: string;
      };
    }): Promise<{ error: Error | null }>;
    signInWithOtp(args: {
      email: string;
      options: {
        emailRedirectTo: string;
        shouldCreateUser: boolean;
      };
    }): Promise<{ error: Error | null }>;
    verifyOtp(args: {
      email: string;
      token: string;
      type: "email";
    }): Promise<{ error: Error | null }>;
    signOut(): Promise<{ error: Error | null }>;
  };
};

export function createParentAuthActions(
  client: ParentAuthClient,
  redirectTo: string,
) {
  return {
    async signInWithApple() {
      const { error } = await client.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo,
        },
      });

      if (error) {
        throw error;
      }
    },
    async signInWithGoogle() {
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        throw error;
      }
    },
    async sendMagicLink(email: string) {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }
    },
    async verifyEmailOtp(email: string, token: string) {
      const { error } = await client.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "email",
      });

      if (error) {
        throw error;
      }
    },
    async signOut() {
      const { error } = await client.auth.signOut();

      if (error) {
        throw error;
      }
    },
  };
}
