import {
  createChildSessionStore,
  type ChildSession,
  type ChildSessionStorage,
} from "@/features/children/child-session";

function createMemoryStorage(): ChildSessionStorage {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

const session: ChildSession = {
  accessCode: "123456",
  childName: "Mia",
  childProfileId: "child-1",
  householdId: "household-1",
  currency: "RSD",
};

describe("child session store", () => {
  it("round-trips a saved session", () => {
    const store = createChildSessionStore(createMemoryStorage());

    store.save(session);
    expect(store.load()).toEqual(session);
  });

  it("returns null when nothing is stored", () => {
    const store = createChildSessionStore(createMemoryStorage());
    expect(store.load()).toBeNull();
  });

  it("returns null for corrupted or codeless payloads", () => {
    const storage = createMemoryStorage();
    const store = createChildSessionStore(storage);

    storage.setItem("chorey.child-session", "not json {");
    expect(store.load()).toBeNull();

    storage.setItem("chorey.child-session", JSON.stringify({ childName: "Mia" }));
    expect(store.load()).toBeNull();
  });

  it("falls back to USD for an unknown stored currency", () => {
    const store = createChildSessionStore(createMemoryStorage());

    store.save({ ...session, currency: "XYZ" as ChildSession["currency"] });
    expect(store.load()?.currency).toBe("USD");
  });

  it("clears the session on log out", () => {
    const store = createChildSessionStore(createMemoryStorage());

    store.save(session);
    store.clear();
    expect(store.load()).toBeNull();
  });
});
