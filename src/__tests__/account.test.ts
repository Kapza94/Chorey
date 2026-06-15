import { createAccountActions } from "@/features/account/account";

describe("createAccountActions.deleteAccount", () => {
  it("calls the delete_my_account RPC", async () => {
    const calls: string[] = [];
    const client = {
      rpc(fn: string) {
        calls.push(fn);
        return Promise.resolve({ data: null, error: null });
      },
    };
    await createAccountActions(client).deleteAccount();
    expect(calls).toEqual(["delete_my_account"]);
  });

  it("throws when the RPC errors", async () => {
    const client = {
      rpc: () => Promise.resolve({ data: null, error: new Error("nope") }),
    };
    await expect(createAccountActions(client).deleteAccount()).rejects.toThrow("nope");
  });
});
