type RpcClient = {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{
    data: any;
    error: Error | null;
  }>;
};

export type WishlistItemStatus = "active" | "requested" | "purchased";

export type SpendWishlistItem = {
  id: string;
  name: string;
  status: WishlistItemStatus;
  targetCents: number;
  /** a new note from the other side the viewer hasn't seen yet. */
  hasUnread: boolean;
};

export type WishNote = {
  id: string;
  authorKind: "parent" | "child";
  authorName: string;
  body: string;
  createdAt: string;
};

export type PurchaseRequest = {
  id: string;
  status: "pending" | "approved" | "declined";
  wishlistItemId: string;
};

export type HouseholdPurchaseRequest = PurchaseRequest & {
  childName: string;
  itemName: string;
  targetCents: number;
  /** an unseen note from the child on this wish. */
  hasUnread: boolean;
};

function mapWishlistItem(row: any): SpendWishlistItem {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    targetCents: row.target_cents,
    hasUnread: row.has_unread ?? false,
  };
}

function mapWishNote(row: any): WishNote {
  return {
    id: row.id,
    authorKind: row.author_kind,
    authorName: row.author_name ?? "",
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapPurchaseRequest(row: any): PurchaseRequest {
  return {
    id: row.id,
    status: row.status,
    wishlistItemId: row.wishlist_item_id,
  };
}

function mapHouseholdPurchaseRequest(row: any): HouseholdPurchaseRequest {
  return {
    childName: row.child_name,
    id: row.id,
    itemName: row.item_name,
    status: row.status,
    targetCents: row.target_cents,
    wishlistItemId: row.wishlist_item_id,
    hasUnread: row.has_unread ?? false,
  };
}

export function createSpendWishlistActions(client: RpcClient) {
  return {
    async listChildWishlist(accessCode: string): Promise<SpendWishlistItem[]> {
      const result = await client.rpc("list_child_wishlist_items", {
        input_access_code: accessCode,
      });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map(mapWishlistItem);
    },

    async createChildWishlistItem(input: {
      accessCode: string;
      name: string;
      targetCents: number;
    }): Promise<SpendWishlistItem> {
      const result = await client.rpc("create_child_wishlist_item", {
        input_access_code: input.accessCode,
        input_name: input.name.trim(),
        input_target_cents: input.targetCents,
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;

      if (!row) {
        throw new Error("Wishlist item was not created.");
      }

      return mapWishlistItem(row);
    },

    async requestPurchase(input: {
      accessCode: string;
      wishlistItemId: string;
    }): Promise<PurchaseRequest> {
      const result = await client.rpc("request_wishlist_purchase", {
        input_access_code: input.accessCode,
        input_wishlist_item_id: input.wishlistItemId,
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;

      if (!row) {
        throw new Error("Purchase was not requested.");
      }

      return mapPurchaseRequest(row);
    },

    async listChildWishNotes(input: {
      accessCode: string;
      wishlistItemId: string;
    }): Promise<WishNote[]> {
      const result = await client.rpc("list_wish_notes", {
        input_access_code: input.accessCode,
        input_wishlist_item_id: input.wishlistItemId,
      });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map(mapWishNote);
    },

    async addChildWishNote(input: {
      accessCode: string;
      wishlistItemId: string;
      body: string;
    }): Promise<WishNote> {
      const result = await client.rpc("add_wish_note", {
        input_access_code: input.accessCode,
        input_wishlist_item_id: input.wishlistItemId,
        input_body: input.body.trim(),
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!row) {
        throw new Error("Note was not added.");
      }

      return mapWishNote(row);
    },

    async addParentWishNote(input: {
      wishlistItemId: string;
      body: string;
    }): Promise<WishNote> {
      const result = await client.rpc("add_parent_wish_note", {
        input_wishlist_item_id: input.wishlistItemId,
        input_body: input.body.trim(),
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      if (!row) {
        throw new Error("Note was not added.");
      }

      return mapWishNote(row);
    },

    async markWishNotesSeen(wishlistItemId: string): Promise<void> {
      const result = await client.rpc("mark_wish_notes_seen", {
        input_wishlist_item_id: wishlistItemId,
      });

      if (result.error) {
        throw result.error;
      }
    },

    async listHouseholdPurchaseRequests(
      householdId: string,
    ): Promise<HouseholdPurchaseRequest[]> {
      const result = await client.rpc("list_household_purchase_requests", {
        input_household_id: householdId,
      });

      if (result.error) {
        throw result.error;
      }

      return (result.data ?? []).map(mapHouseholdPurchaseRequest);
    },

    async approvePurchaseRequest(input: {
      householdId: string;
      requestId: string;
    }): Promise<PurchaseRequest> {
      const result = await client.rpc("approve_purchase_request", {
        input_household_id: input.householdId,
        input_request_id: input.requestId,
      });

      if (result.error) {
        throw result.error;
      }

      const row = Array.isArray(result.data) ? result.data[0] : result.data;

      if (!row) {
        throw new Error("Purchase request was not approved.");
      }

      return mapPurchaseRequest(row);
    },
  };
}
