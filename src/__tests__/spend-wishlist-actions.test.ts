import { createSpendWishlistActions } from "@/features/spend-wishlist/spend-wishlist-actions";

describe("spend wishlist actions", () => {
  it("loads child wishlist items by access code", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: [
          {
            id: "wish-1",
            name: "Football",
            target_cents: 2500,
            status: "active",
          },
        ],
        error: null,
      }),
    };
    const actions = createSpendWishlistActions(client);

    await expect(actions.listChildWishlist("123456")).resolves.toEqual([
      {
        id: "wish-1",
        name: "Football",
        status: "active",
        targetCents: 2500,
        hasUnread: false,
      },
    ]);
    expect(client.rpc).toHaveBeenCalledWith("list_child_wishlist_items", {
      input_access_code: "123456",
    });
  });

  it("creates a child wishlist item", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          id: "wish-1",
          name: "Football",
          target_cents: 2500,
          status: "active",
        },
        error: null,
      }),
    };
    const actions = createSpendWishlistActions(client);

    await expect(
      actions.createChildWishlistItem({
        accessCode: "123456",
        name: " Football ",
        targetCents: 2500,
      }),
    ).resolves.toEqual({
      id: "wish-1",
      name: "Football",
      status: "active",
      targetCents: 2500,
      hasUnread: false,
    });
    expect(client.rpc).toHaveBeenCalledWith("create_child_wishlist_item", {
      input_access_code: "123456",
      input_name: "Football",
      input_target_cents: 2500,
    });
  });

  it("requests purchase only when spend balance can cover it", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          id: "request-1",
          status: "pending",
          wishlist_item_id: "wish-1",
        },
        error: null,
      }),
    };
    const actions = createSpendWishlistActions(client);

    await expect(
      actions.requestPurchase({
        accessCode: "123456",
        wishlistItemId: "wish-1",
      }),
    ).resolves.toEqual({
      id: "request-1",
      status: "pending",
      wishlistItemId: "wish-1",
    });
    expect(client.rpc).toHaveBeenCalledWith("request_wishlist_purchase", {
      input_access_code: "123456",
      input_wishlist_item_id: "wish-1",
    });
  });

  it("loads household purchase requests", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: [
          {
            child_name: "Mina",
            id: "request-1",
            item_name: "Football",
            status: "pending",
            target_cents: 2500,
            wishlist_item_id: "wish-1",
          },
        ],
        error: null,
      }),
    };
    const actions = createSpendWishlistActions(client);

    await expect(actions.listHouseholdPurchaseRequests("household-1")).resolves.toEqual([
      {
        childName: "Mina",
        id: "request-1",
        itemName: "Football",
        status: "pending",
        targetCents: 2500,
        wishlistItemId: "wish-1",
        hasUnread: false,
      },
    ]);
  });

  it("approves a purchase request", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          id: "request-1",
          status: "approved",
          wishlist_item_id: "wish-1",
        },
        error: null,
      }),
    };
    const actions = createSpendWishlistActions(client);

    await expect(
      actions.approvePurchaseRequest({
        householdId: "household-1",
        requestId: "request-1",
      }),
    ).resolves.toEqual({
      id: "request-1",
      status: "approved",
      wishlistItemId: "wish-1",
    });
    expect(client.rpc).toHaveBeenCalledWith("approve_purchase_request", {
      input_household_id: "household-1",
      input_request_id: "request-1",
    });
  });

  it("lists a wish's note thread for the child", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: [
          {
            id: "note-1",
            author_kind: "parent",
            author_name: "Dad",
            body: "Finish your chores first",
            created_at: "2026-06-25T10:00:00Z",
          },
        ],
        error: null,
      }),
    };
    const actions = createSpendWishlistActions(client);

    await expect(
      actions.listChildWishNotes({ accessCode: "123456", wishlistItemId: "wish-1" }),
    ).resolves.toEqual([
      {
        id: "note-1",
        authorKind: "parent",
        authorName: "Dad",
        body: "Finish your chores first",
        createdAt: "2026-06-25T10:00:00Z",
      },
    ]);
    expect(client.rpc).toHaveBeenCalledWith("list_wish_notes", {
      input_access_code: "123456",
      input_wishlist_item_id: "wish-1",
    });
  });

  it("adds a child note (trimmed) to a wish", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          id: "note-2",
          author_kind: "child",
          author_name: "Mia",
          body: "Please?",
          created_at: "2026-06-25T11:00:00Z",
        },
        error: null,
      }),
    };
    const actions = createSpendWishlistActions(client);

    await actions.addChildWishNote({
      accessCode: "123456",
      wishlistItemId: "wish-1",
      body: "  Please?  ",
    });
    expect(client.rpc).toHaveBeenCalledWith("add_wish_note", {
      input_access_code: "123456",
      input_wishlist_item_id: "wish-1",
      input_body: "Please?",
    });
  });

  it("adds a parent note and marks a thread seen", async () => {
    const client = {
      rpc: jest.fn().mockResolvedValue({
        data: {
          id: "note-3",
          author_kind: "parent",
          author_name: "Dad",
          body: "Sure!",
          created_at: "2026-06-25T12:00:00Z",
        },
        error: null,
      }),
    };
    const actions = createSpendWishlistActions(client);

    await actions.addParentWishNote({ wishlistItemId: "wish-1", body: "Sure!" });
    expect(client.rpc).toHaveBeenCalledWith("add_parent_wish_note", {
      input_wishlist_item_id: "wish-1",
      input_body: "Sure!",
    });

    await actions.markWishNotesSeen("wish-1");
    expect(client.rpc).toHaveBeenCalledWith("mark_wish_notes_seen", {
      input_wishlist_item_id: "wish-1",
    });
  });
});
