import {
  createSpendWishlistActions,
  type HouseholdPurchaseRequest,
  type SpendWishlistItem,
  type WishNote,
} from "@/features/spend-wishlist/spend-wishlist-actions";
import { supabase } from "@/lib/supabase";

export async function listWishlistForChild(
  accessCode: string,
): Promise<SpendWishlistItem[]> {
  return createSpendWishlistActions(supabase).listChildWishlist(accessCode);
}

export async function createWishlistItemForChild(input: {
  accessCode: string;
  name: string;
  targetCents: number;
}): Promise<SpendWishlistItem> {
  return createSpendWishlistActions(supabase).createChildWishlistItem(input);
}

export async function requestWishlistPurchase(input: {
  accessCode: string;
  wishlistItemId: string;
}) {
  return createSpendWishlistActions(supabase).requestPurchase(input);
}

export async function listPurchaseRequestsForHousehold(
  householdId: string,
): Promise<HouseholdPurchaseRequest[]> {
  return createSpendWishlistActions(supabase).listHouseholdPurchaseRequests(
    householdId,
  );
}

export async function approvePurchaseRequestForHousehold(input: {
  householdId: string;
  requestId: string;
}) {
  return createSpendWishlistActions(supabase).approvePurchaseRequest(input);
}

// ── Wish notes ──────────────────────────────────────────────────────────────

export async function listWishNotesForChild(input: {
  accessCode: string;
  wishlistItemId: string;
}): Promise<WishNote[]> {
  return createSpendWishlistActions(supabase).listChildWishNotes(input);
}

export async function addWishNoteForChild(input: {
  accessCode: string;
  wishlistItemId: string;
  body: string;
}): Promise<WishNote> {
  return createSpendWishlistActions(supabase).addChildWishNote(input);
}

/** Parent reads a wish's thread directly (RLS lets household members select). */
export async function listWishNotesForParent(
  wishlistItemId: string,
): Promise<WishNote[]> {
  const { data, error } = await supabase
    .from("wish_notes")
    .select("id, author_kind, author_name, body, created_at")
    .eq("wishlist_item_id", wishlistItemId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    authorKind: row.author_kind,
    authorName: row.author_name ?? "",
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function addWishNoteForParent(input: {
  wishlistItemId: string;
  body: string;
}): Promise<WishNote> {
  return createSpendWishlistActions(supabase).addParentWishNote(input);
}

export async function markWishNotesSeenForParent(
  wishlistItemId: string,
): Promise<void> {
  return createSpendWishlistActions(supabase).markWishNotesSeen(wishlistItemId);
}
