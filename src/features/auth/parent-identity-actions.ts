import { supabase } from "@/lib/supabase";
import { avatarPublicUrl } from "@/features/account/avatar-actions";

export type ParentIdentity = {
  name: string;
  email: string;
  /** "google" | "apple" | "email" */
  provider: string;
  avatarUrl: string | null;
};

/** Read the signed-in parent's identity from their auth session — name, email,
 *  provider, and (for Google) their profile photo. A custom display_name saved
 *  to `profiles` wins over the provider-supplied name. */
export async function getParentIdentity(): Promise<ParentIdentity | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  const user = data.user;
  const meta = user.user_metadata ?? {};
  const providerFromApp = (user.app_metadata?.provider as string | undefined) ?? "email";

  let displayName: string | null = null;
  let uploadedAvatar: string | null = null;
  const profile = await supabase
    .from("profiles")
    .select("display_name, avatar_path")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile.error) {
    displayName = (profile.data?.display_name as string | null) ?? null;
    uploadedAvatar = avatarPublicUrl(
      supabase,
      profile.data?.avatar_path as string | null | undefined,
    );
  }

  const providerName =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    null;

  return {
    name: displayName || providerName || user.email?.split("@")[0] || "Parent",
    email: user.email ?? "",
    provider: providerFromApp,
    // A photo the parent uploaded wins over the provider-supplied one.
    avatarUrl:
      uploadedAvatar ??
      (meta.avatar_url as string | undefined) ??
      (meta.picture as string | undefined) ??
      null,
  };
}

/** Persist the parent's chosen display name to `profiles` (upsert). */
export async function updateParentDisplayName(name: string): Promise<void> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return;
  }
  await supabase
    .from("profiles")
    .upsert({ id: data.user.id, display_name: name.trim() }, { onConflict: "id" });
}
