import * as ImagePicker from "expo-image-picker";

import { createChildPhotoActions } from "@/features/chores/child-photo-actions";
import { supabase } from "@/lib/supabase";

export type PickedPhoto = { uri: string; base64: string };

/**
 * Let the kid capture a photo of their finished chore. Uses the camera when it's
 * available (the natural "show me you did it" flow); falls back to the photo
 * library when the camera is denied or unavailable (e.g. the simulator).
 * Returns null when the kid cancels. quality 0.5 keeps the base64 small enough
 * to ship through the edge function without resizing.
 */
export async function pickChorePhoto(): Promise<PickedPhoto | null> {
  const camera = await ImagePicker.requestCameraPermissionsAsync();
  const result = camera.granted
    ? await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true })
    : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true });

  const asset = result.canceled ? null : result.assets?.[0];
  if (!asset?.base64) {
    return null;
  }

  return { uri: asset.uri, base64: asset.base64 };
}

export async function uploadChorePhotoForChild(input: {
  accessCode: string;
  choreId: string;
  imageBase64: string;
}): Promise<void> {
  return createChildPhotoActions(supabase).uploadChorePhoto(input);
}
