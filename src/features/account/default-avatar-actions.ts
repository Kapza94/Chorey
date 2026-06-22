import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { base64ToBytes, createAvatarActions } from "@/features/account/avatar-actions";
import { supabase } from "@/lib/supabase";

/**
 * Let the signed-in parent pick a square photo from their library and upload it
 * as their avatar. Returns the new public URL, or null if they cancel. The image
 * is cropped square and compressed so it stays small. If library access was
 * denied, points the parent to Settings (iOS only prompts once).
 */
export async function pickAndUploadParentAvatar(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    // A flat denial with no further prompt available means the OS won't ask
    // again — the only path back is Settings, so say so.
    if (!permission.canAskAgain) {
      Alert.alert(
        "Photo access needed",
        "Allow photo access in Settings to set a profile picture.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => void Linking.openSettings() },
        ],
      );
    }
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  });

  const asset = result.canceled ? null : result.assets?.[0];
  if (!asset?.base64) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return null;
  }

  // The current path, so the factory can delete it after the new one lands.
  const existing = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", data.user.id)
    .maybeSingle();

  const contentType = asset.mimeType === "image/png" ? "image/png" : "image/jpeg";
  return createAvatarActions(supabase).uploadAvatar({
    userId: data.user.id,
    bytes: base64ToBytes(asset.base64),
    contentType,
    previousPath: (existing.data?.avatar_path as string | null | undefined) ?? null,
  });
}
