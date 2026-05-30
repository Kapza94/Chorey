import {
  createSpendWishlistActions,
  type HouseholdPurchaseRequest,
  type SpendWishlistItem,
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
