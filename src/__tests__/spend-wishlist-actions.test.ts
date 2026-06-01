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
});
