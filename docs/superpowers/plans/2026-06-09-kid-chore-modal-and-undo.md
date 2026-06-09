# Kid Chore Modal and Undo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every child chore open a focused bottom-sheet modal and allow a child to undo a submitted chore until a parent approves it.

**Architecture:** PostgreSQL remains the authority for the `submitted -> assigned` transition through a child-code-scoped security-definer RPC. The React Native route owns mutations and local row replacement, while `KidApp` owns modal selection and a dedicated `KidChoreModal` owns state-specific presentation, confirmation, loading, and errors.

**Tech Stack:** Expo 56, React Native 0.85, Expo Router, TypeScript, Jest, React Native Testing Library, Supabase PostgreSQL, pgTAP

---

## File Map

- Create `supabase/migrations/20260609170000_child_chore_submission_undo.sql`: secure child undo RPC and execute grants.
- Create `supabase/tests/child_chore_undo.test.sql`: authorization, transition, race, and ledger regression coverage.
- Modify `src/features/chores/child-chore-actions.ts`: expose `undoSubmission`.
- Modify `src/features/chores/default-child-chore-actions.ts`: export the default undo adapter.
- Modify `src/__tests__/child-chore-actions.test.ts`: verify RPC mapping and empty-result failure.
- Create `src/features/kid-home/kid-chore-modal.tsx`: focused bottom sheet with submit, undo confirmation, loading, and inline error states.
- Create `src/__tests__/kid-chore-modal.test.tsx`: component behavior for todo, waiting, approved, confirmation, and failures.
- Modify `src/features/kid-home/kid-home-screen.tsx`: make every row an open-details button instead of a direct completion control.
- Modify `src/features/kid-home/kid-app.tsx`: own selected chore state and render `KidChoreModal`.
- Modify `src/__tests__/kid-home-screen.test.tsx`: verify every chore state opens instead of submitting.
- Modify `src/__tests__/kid-app.test.tsx`: verify modal integration and callback forwarding.
- Modify `src/app/child/home.tsx`: call submit/undo actions and update current chore state.
- Modify `src/app/child/dashboard.tsx`: keep the legacy child route behavior aligned.
- Create `src/__tests__/child-home-route.test.tsx`: verify route mutation wiring and stale-undo refresh.

### Task 1: Add the Secure Undo Transition

**Files:**
- Create: `supabase/tests/child_chore_undo.test.sql`
- Create: `supabase/migrations/20260609170000_child_chore_submission_undo.sql`

- [ ] **Step 1: Write the failing pgTAP test**

Create `supabase/tests/child_chore_undo.test.sql` with fixtures for two children and four chores:

```sql
begin;

select plan(9);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000c01', 'undo-parent@example.com');

insert into public.households (id, owner_user_id, name)
values (
  '00000000-0000-0000-0000-000000000c02',
  '00000000-0000-0000-0000-000000000c01',
  'Undo home'
);

insert into public.household_members (household_id, user_id, role)
values (
  '00000000-0000-0000-0000-000000000c02',
  '00000000-0000-0000-0000-000000000c01',
  'parent_admin'
);

insert into public.child_profiles (id, household_id, display_name)
values
  ('00000000-0000-0000-0000-000000000c03', '00000000-0000-0000-0000-000000000c02', 'Mia'),
  ('00000000-0000-0000-0000-000000000c04', '00000000-0000-0000-0000-000000000c02', 'Theo');

insert into public.child_access_codes (
  child_profile_id,
  household_id,
  access_code,
  created_by_user_id
)
values
  (
    '00000000-0000-0000-0000-000000000c03',
    '00000000-0000-0000-0000-000000000c02',
    '111222',
    '00000000-0000-0000-0000-000000000c01'
  ),
  (
    '00000000-0000-0000-0000-000000000c04',
    '00000000-0000-0000-0000-000000000c02',
    '333444',
    '00000000-0000-0000-0000-000000000c01'
  );

insert into public.chore_instances (
  id,
  household_id,
  child_profile_id,
  title,
  reward_cents,
  status,
  created_by_user_id
)
values
  (
    '00000000-0000-0000-0000-000000000c11',
    '00000000-0000-0000-0000-000000000c02',
    '00000000-0000-0000-0000-000000000c03',
    'Submitted',
    100,
    'submitted',
    '00000000-0000-0000-0000-000000000c01'
  ),
  (
    '00000000-0000-0000-0000-000000000c12',
    '00000000-0000-0000-0000-000000000c02',
    '00000000-0000-0000-0000-000000000c03',
    'Assigned',
    200,
    'assigned',
    '00000000-0000-0000-0000-000000000c01'
  ),
  (
    '00000000-0000-0000-0000-000000000c13',
    '00000000-0000-0000-0000-000000000c02',
    '00000000-0000-0000-0000-000000000c03',
    'Approved',
    300,
    'approved',
    '00000000-0000-0000-0000-000000000c01'
  ),
  (
    '00000000-0000-0000-0000-000000000c14',
    '00000000-0000-0000-0000-000000000c02',
    '00000000-0000-0000-0000-000000000c04',
    'Other child',
    400,
    'submitted',
    '00000000-0000-0000-0000-000000000c01'
  );

select has_function(
  'public',
  'undo_child_chore_submission',
  array['text', 'uuid'],
  'child undo RPC exists'
);

select is(
  (
    select status::text
    from public.undo_child_chore_submission(
      '111-222',
      '00000000-0000-0000-0000-000000000c11'
    )
  ),
  'assigned',
  'assigned child can undo a submitted chore'
);

select is(
  (
    select status::text
    from public.chore_instances
    where id = '00000000-0000-0000-0000-000000000c11'
  ),
  'assigned',
  'undo persists the assigned status'
);

select is(
  (
    select count(*)::integer
    from public.ledger_events
    where chore_instance_id = '00000000-0000-0000-0000-000000000c11'
  ),
  0,
  'undo creates no ledger event'
);

select is_empty(
  $$ select * from public.undo_child_chore_submission(
    '000000',
    '00000000-0000-0000-0000-000000000c14'
  ) $$,
  'invalid access code cannot undo'
);

select is_empty(
  $$ select * from public.undo_child_chore_submission(
    '111222',
    '00000000-0000-0000-0000-000000000c14'
  ) $$,
  'one child cannot undo another child chore'
);

select is_empty(
  $$ select * from public.undo_child_chore_submission(
    '111222',
    '00000000-0000-0000-0000-000000000c12'
  ) $$,
  'assigned chore cannot be undone'
);

select is_empty(
  $$ select * from public.undo_child_chore_submission(
    '111222',
    '00000000-0000-0000-0000-000000000c13'
  ) $$,
  'approved chore cannot be undone'
);

select is(
  (
    select status::text
    from public.chore_instances
    where id = '00000000-0000-0000-0000-000000000c13'
  ),
  'approved',
  'approval wins an undo race'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Run the database test and verify it fails**

Run:

```bash
npm run db:test
```

Expected: FAIL because `public.undo_child_chore_submission(text, uuid)` does not exist.

- [ ] **Step 3: Add the minimal migration**

Create `supabase/migrations/20260609170000_child_chore_submission_undo.sql`:

```sql
create function public.undo_child_chore_submission(
  input_access_code text,
  input_chore_id uuid
)
returns table (
  id uuid,
  title text,
  reward_cents integer,
  status public.chore_status,
  sent_back_reason text
)
language sql
security definer
set search_path = public
as $$
  update public.chore_instances chore
  set status = 'assigned', sent_back_reason = null
  from public.child_access_codes code
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
    and chore.id = input_chore_id
    and chore.child_profile_id = code.child_profile_id
    and chore.status = 'submitted'
  returning
    chore.id,
    chore.title,
    chore.reward_cents,
    chore.status,
    chore.sent_back_reason
$$;

grant execute on function public.undo_child_chore_submission(text, uuid)
to anon, authenticated;
```

- [ ] **Step 4: Reset the local database and run all database tests**

Run:

```bash
npm run db:reset
npm run db:test
```

Expected: reset succeeds and every pgTAP file passes.

- [ ] **Step 5: Commit the database transition**

```bash
git add supabase/migrations/20260609170000_child_chore_submission_undo.sql supabase/tests/child_chore_undo.test.sql
git commit -m "feat(chores): allow child to undo submitted chore"
```

### Task 2: Expose Undo Through Child Chore Actions

**Files:**
- Modify: `src/features/chores/child-chore-actions.ts`
- Modify: `src/features/chores/default-child-chore-actions.ts`
- Modify: `src/__tests__/child-chore-actions.test.ts`

- [ ] **Step 1: Add failing action tests**

Add tests that require the exact RPC call and reject an empty result:

```ts
it("undoes a submitted chore", async () => {
  const client = {
    rpc: jest.fn(() =>
      Promise.resolve({
        data: [
          {
            id: "chore-1",
            title: "Load dishwasher",
            reward_cents: 250,
            status: "assigned",
            sent_back_reason: null,
          },
        ],
        error: null,
      }),
    ),
  };

  const chore = await createChildChoreActions(client).undoSubmission({
    accessCode: "123456",
    choreId: "chore-1",
  });

  expect(chore.status).toBe("assigned");
  expect(client.rpc).toHaveBeenCalledWith("undo_child_chore_submission", {
    input_access_code: "123456",
    input_chore_id: "chore-1",
  });
});

it("rejects an undo when the server changes no row", async () => {
  const client = {
    rpc: jest.fn(() => Promise.resolve({ data: [], error: null })),
  };

  await expect(
    createChildChoreActions(client).undoSubmission({
      accessCode: "123456",
      choreId: "chore-1",
    }),
  ).rejects.toThrow("Chore can no longer be moved back to To do.");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm test -- --runInBand src/__tests__/child-chore-actions.test.ts
```

Expected: FAIL because `undoSubmission` is undefined.

- [ ] **Step 3: Implement the action and adapter**

In `createChildChoreActions`, add:

```ts
async undoSubmission(input: {
  accessCode: string;
  choreId: string;
}): Promise<ChildChore> {
  const result = await client.rpc("undo_child_chore_submission", {
    input_access_code: input.accessCode,
    input_chore_id: input.choreId,
  });

  if (result.error) {
    throw result.error;
  }

  const row = Array.isArray(result.data) ? result.data[0] : result.data;

  if (!row) {
    throw new Error("Chore can no longer be moved back to To do.");
  }

  return mapChore(row);
},
```

In `src/features/chores/default-child-chore-actions.ts`, export:

```ts
export async function undoChoreSubmissionForChild(input: {
  accessCode: string;
  choreId: string;
}): Promise<ChildChore> {
  return createChildChoreActions(supabase).undoSubmission(input);
}
```

- [ ] **Step 4: Run action tests**

Run:

```bash
npm test -- --runInBand src/__tests__/child-chore-actions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the client action**

```bash
git add src/features/chores/child-chore-actions.ts src/features/chores/default-child-chore-actions.ts src/__tests__/child-chore-actions.test.ts
git commit -m "feat(chores): expose child submission undo"
```

### Task 3: Build the Focused Chore Modal

**Files:**
- Create: `src/features/kid-home/kid-chore-modal.tsx`
- Create: `src/__tests__/kid-chore-modal.test.tsx`

- [ ] **Step 1: Write modal behavior tests**

Cover these exact behaviors:

```tsx
const todo = {
  id: "c1",
  name: "Make the bed",
  valueCents: 100,
  state: "todo" as const,
};

it("submits a to-do chore from the modal", async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(
    <KidChoreModal
      chore={todo}
      currency="USD"
      onClose={jest.fn()}
      onSubmit={onSubmit}
      onUndo={jest.fn()}
    />,
  );

  fireEvent.press(screen.getByLabelText("Mark as finished"));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("c1"));
});

it("confirms before undoing a waiting chore", async () => {
  const onUndo = jest.fn().mockResolvedValue(undefined);
  render(
    <KidChoreModal
      chore={{ ...todo, state: "waiting" }}
      currency="USD"
      onClose={jest.fn()}
      onSubmit={jest.fn()}
      onUndo={onUndo}
    />,
  );

  fireEvent.press(screen.getByLabelText("Undo finished"));
  expect(screen.getByText("Move this chore back to To do?")).toBeOnTheScreen();
  expect(onUndo).not.toHaveBeenCalled();

  fireEvent.press(screen.getByLabelText("Confirm move to To do"));
  await waitFor(() => expect(onUndo).toHaveBeenCalledWith("c1"));
});

it("keeps an approved chore read-only", () => {
  render(
    <KidChoreModal
      chore={{ ...todo, state: "approved" }}
      currency="USD"
      onClose={jest.fn()}
      onSubmit={jest.fn()}
      onUndo={jest.fn()}
    />,
  );

  expect(screen.getByText("Approved")).toBeOnTheScreen();
  expect(screen.queryByLabelText("Mark as finished")).toBeNull();
  expect(screen.queryByLabelText("Undo finished")).toBeNull();
});

it("keeps the modal open and reports a mutation failure", async () => {
  const onSubmit = jest.fn().mockRejectedValue(new Error("Network request failed"));
  render(
    <KidChoreModal
      chore={todo}
      currency="USD"
      onClose={jest.fn()}
      onSubmit={onSubmit}
      onUndo={jest.fn()}
    />,
  );

  fireEvent.press(screen.getByLabelText("Mark as finished"));

  expect(
    await screen.findByText("Network request failed"),
  ).toBeOnTheScreen();
  expect(screen.getByText("Make the bed")).toBeOnTheScreen();
});
```

Also test that cancelling the undo confirmation does not call `onUndo`, and that buttons are disabled while their returned promise is pending.

```tsx
it("cancels undo without changing the chore", () => {
  const onUndo = jest.fn();
  render(
    <KidChoreModal
      chore={{ ...todo, state: "waiting" }}
      currency="USD"
      onClose={jest.fn()}
      onSubmit={jest.fn()}
      onUndo={onUndo}
    />,
  );

  fireEvent.press(screen.getByLabelText("Undo finished"));
  fireEvent.press(screen.getByLabelText("Cancel undo"));

  expect(onUndo).not.toHaveBeenCalled();
  expect(screen.queryByText("Move this chore back to To do?")).toBeNull();
});

it("disables mutation controls while an action is pending", () => {
  const onSubmit = jest.fn(() => new Promise<void>(() => undefined));
  render(
    <KidChoreModal
      chore={todo}
      currency="USD"
      onClose={jest.fn()}
      onSubmit={onSubmit}
      onUndo={jest.fn()}
    />,
  );

  fireEvent.press(screen.getByLabelText("Mark as finished"));

  expect(screen.getByLabelText("Mark as finished")).toBeDisabled();
});
```

- [ ] **Step 2: Run the modal test and verify it fails**

Run:

```bash
npm test -- --runInBand src/__tests__/kid-chore-modal.test.tsx
```

Expected: FAIL because `KidChoreModal` does not exist.

- [ ] **Step 3: Implement the modal**

Create a `Modal` with a dismissible backdrop and bottom-anchored sheet matching the existing wishlist sheet. Use this public contract:

```ts
type Props = {
  chore: KidChore | null;
  currency: CurrencyCode;
  onClose: () => void;
  onSubmit: (choreId: string) => Promise<void>;
  onUndo: (choreId: string) => Promise<void>;
};
```

Keep the component state limited to:

```ts
const [confirmingUndo, setConfirmingUndo] = useState(false);
const [pendingAction, setPendingAction] = useState<"submit" | "undo" | null>(null);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

Use one helper for both mutations:

```ts
async function runAction(
  action: "submit" | "undo",
  callback: (choreId: string) => Promise<void>,
) {
  if (!chore || pendingAction) {
    return;
  }

  setPendingAction(action);
  setErrorMessage(null);

  try {
    await callback(chore.id);
    setConfirmingUndo(false);
  } catch (error) {
    setErrorMessage(
      error instanceof Error ? error.message : "Something went wrong. Try again.",
    );
  } finally {
    setPendingAction(null);
  }
}
```

Render:

- title and formatted reward for every state;
- sent-back note for todo chores when `chore.note` exists;
- **Mark as finished** for `todo`;
- **Waiting for parent** and **Undo finished** for `waiting`;
- **Approved** with no mutation button for `approved`;
- confirmation copy, **Cancel**, and accessibility label `Confirm move to To do`;
- `accessibilityLabel="Close chore"` on the close control;
- `accessibilityLabel="Dismiss chore"` on the backdrop;
- inline error text with `accessibilityRole="alert"`.

- [ ] **Step 4: Run modal tests**

Run:

```bash
npm test -- --runInBand src/__tests__/kid-chore-modal.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the modal**

```bash
git add src/features/kid-home/kid-chore-modal.tsx src/__tests__/kid-chore-modal.test.tsx
git commit -m "feat(kid): add chore detail modal"
```

### Task 4: Open the Modal From Every Chore Row

**Files:**
- Modify: `src/features/kid-home/kid-home-screen.tsx`
- Modify: `src/features/kid-home/kid-app.tsx`
- Modify: `src/__tests__/kid-home-screen.test.tsx`
- Modify: `src/__tests__/kid-app.test.tsx`

- [ ] **Step 1: Replace direct-toggle tests with open-detail tests**

In `kid-home-screen.test.tsx`, replace the two mutation-oriented tests with:

```tsx
it.each([
  ["Make the bed", "c1"],
  ["Walk the dog", "c2"],
])("opens %s when its row is pressed", (label, id) => {
  const onOpenChore = jest.fn();
  renderHome({ onOpenChore });

  fireEvent.press(screen.getByLabelText(label));

  expect(onOpenChore).toHaveBeenCalledWith(id);
});
```

In `kid-app.test.tsx`, add:

```tsx
it("opens chore details and submits through the modal", async () => {
  const onSubmitChore = jest.fn().mockResolvedValue(undefined);
  render(<KidApp {...baseProps} onSubmitChore={onSubmitChore} />);

  fireEvent.press(screen.getByLabelText("Make the bed"));
  expect(screen.getByLabelText("Close chore")).toBeOnTheScreen();

  fireEvent.press(screen.getByLabelText("Mark as finished"));
  await waitFor(() => expect(onSubmitChore).toHaveBeenCalledWith("c1"));
});
```

Add a waiting chore case that opens the same modal and forwards `onUndoChore`:

```tsx
it("opens a waiting chore and forwards confirmed undo", async () => {
  const onUndoChore = jest.fn().mockResolvedValue(undefined);
  render(
    <KidApp
      {...baseProps}
      chores={[
        {
          id: "c2",
          name: "Walk the dog",
          valueCents: 300,
          state: "waiting",
        },
      ]}
      onUndoChore={onUndoChore}
    />,
  );

  fireEvent.press(screen.getByLabelText("Walk the dog"));
  fireEvent.press(screen.getByLabelText("Undo finished"));
  fireEvent.press(screen.getByLabelText("Confirm move to To do"));

  await waitFor(() => expect(onUndoChore).toHaveBeenCalledWith("c2"));
});
```

- [ ] **Step 2: Run both tests and verify they fail**

Run:

```bash
npm test -- --runInBand src/__tests__/kid-home-screen.test.tsx src/__tests__/kid-app.test.tsx
```

Expected: FAIL because the old props and direct-toggle behavior still exist.

- [ ] **Step 3: Change `KidHomeScreen` to an open-details contract**

Replace:

```ts
onToggleChore?: (id: string) => void;
```

with:

```ts
onOpenChore?: (id: string) => void;
```

Pass `onOpenChore` into every `ChoreRow`. In `ChoreRow`:

```tsx
<Pressable
  accessibilityRole="button"
  accessibilityLabel={chore.name}
  onPress={() => onOpen?.(chore.id)}
>
```

Remove checkbox-style accessibility state and the `actionable` guard. Keep visual state unchanged so waiting and approved rows remain distinguishable.

- [ ] **Step 4: Let `KidApp` own modal selection**

Replace its chore callback prop with:

```ts
onSubmitChore?: (id: string) => Promise<void>;
onUndoChore?: (id: string) => Promise<void>;
```

Add:

```ts
const [selectedChoreId, setSelectedChoreId] = useState<string | null>(null);
const selectedChore =
  chores?.find((chore) => chore.id === selectedChoreId) ?? null;
```

Pass `onOpenChore={setSelectedChoreId}` to `KidHomeScreen`, then render:

```tsx
<KidChoreModal
  chore={selectedChore}
  currency={currency ?? DEFAULT_CURRENCY}
  onClose={() => setSelectedChoreId(null)}
  onSubmit={async (choreId) => {
    if (!onSubmitChore) {
      throw new Error("This chore cannot be updated right now.");
    }
    await onSubmitChore(choreId);
  }}
  onUndo={async (choreId) => {
    if (!onUndoChore) {
      throw new Error("This chore cannot be updated right now.");
    }
    await onUndoChore(choreId);
  }}
/>
```

Import the modal and default currency used above:

```ts
import { KidChoreModal } from "@/features/kid-home/kid-chore-modal";
import {
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/features/money/currency";
```

- [ ] **Step 5: Run focused UI tests**

Run:

```bash
npm test -- --runInBand src/__tests__/kid-home-screen.test.tsx src/__tests__/kid-app.test.tsx src/__tests__/kid-chore-modal.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the UI integration**

```bash
git add src/features/kid-home/kid-home-screen.tsx src/features/kid-home/kid-app.tsx src/__tests__/kid-home-screen.test.tsx src/__tests__/kid-app.test.tsx
git commit -m "feat(kid): open chore details from every row"
```

### Task 5: Wire Submit and Undo Into Both Child Routes

**Files:**
- Modify: `src/app/child/home.tsx`
- Modify: `src/app/child/dashboard.tsx`
- Create: `src/__tests__/child-home-route.test.tsx`

- [ ] **Step 1: Write route mutation tests**

Mock `KidApp` as a small harness that displays the first chore state and exposes the passed callbacks:

```tsx
import { Pressable, Text } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import ChildHomeRoute from "@/app/child/home";

const mockListChoresForChild = jest.fn();
const mockSubmitChoreForChild = jest.fn();
const mockUndoChoreSubmissionForChild = jest.fn();
const mockGetBucketBalancesForChild = jest.fn();
const mockListWishlistForChild = jest.fn();
const mockListGivingOptionsForChild = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");

  return {
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(effect, [effect]);
    },
    useLocalSearchParams: () => ({
      accessCode: "123456",
      childName: "Mia",
    }),
    useRouter: () => ({ replace: jest.fn() }),
  };
});

jest.mock("@/features/kid-home/kid-app", () => ({
  KidApp: (props: {
    chores: Array<{ id: string; state: string }>;
    onSubmitChore: (id: string) => Promise<void>;
    onUndoChore: (id: string) => Promise<void>;
  }) => (
    <>
      <Text>{props.chores[0]?.state ?? "empty"}</Text>
      <Pressable
        accessibilityLabel="Route submit"
        onPress={() => void props.onSubmitChore("c1")}
      />
      <Pressable
        accessibilityLabel="Route undo"
        onPress={() => {
          void props.onUndoChore("c1").catch(() => undefined);
        }}
      />
    </>
  ),
}));

jest.mock("@/features/chores/default-child-chore-actions", () => ({
  listChoresForChild: (...args: unknown[]) => mockListChoresForChild(...args),
  submitChoreForChild: (...args: unknown[]) => mockSubmitChoreForChild(...args),
  undoChoreSubmissionForChild: (...args: unknown[]) =>
    mockUndoChoreSubmissionForChild(...args),
}));

jest.mock("@/features/ledger/default-ledger-actions", () => ({
  getBucketBalancesForChild: (...args: unknown[]) =>
    mockGetBucketBalancesForChild(...args),
}));

jest.mock("@/features/spend-wishlist/default-spend-wishlist-actions", () => ({
  createWishlistItemForChild: jest.fn(),
  listWishlistForChild: (...args: unknown[]) => mockListWishlistForChild(...args),
  requestWishlistPurchase: jest.fn(),
}));

jest.mock("@/features/giving/default-giving-actions", () => ({
  listGivingOptionsForChild: (...args: unknown[]) =>
    mockListGivingOptionsForChild(...args),
  suggestGivingOptionForChild: jest.fn(),
}));
```

Reset and configure the action mocks before each test:

```tsx
beforeEach(() => {
  jest.clearAllMocks();
  mockListChoresForChild.mockResolvedValue([
    {
      id: "c1",
      title: "Make the bed",
      rewardCents: 100,
      status: "assigned",
      sentBackReason: null,
    },
  ]);
  mockSubmitChoreForChild.mockResolvedValue({
    id: "c1",
    title: "Make the bed",
    rewardCents: 100,
    status: "submitted",
    sentBackReason: null,
  });
  mockUndoChoreSubmissionForChild.mockResolvedValue({
    id: "c1",
    title: "Make the bed",
    rewardCents: 100,
    status: "assigned",
    sentBackReason: null,
  });
  mockGetBucketBalancesForChild.mockResolvedValue({
    spendCents: 0,
    savingsCents: 0,
    givingCents: 0,
  });
  mockListWishlistForChild.mockResolvedValue([]);
  mockListGivingOptionsForChild.mockResolvedValue([]);
});

it("replaces the local chore after submit and undo", async () => {
  render(<ChildHomeRoute />);

  expect(await screen.findByText("todo")).toBeOnTheScreen();

  fireEvent.press(screen.getByLabelText("Route submit"));
  expect(await screen.findByText("waiting")).toBeOnTheScreen();

  fireEvent.press(screen.getByLabelText("Route undo"));
  expect(await screen.findByText("todo")).toBeOnTheScreen();

  expect(mockSubmitChoreForChild).toHaveBeenCalledWith({
    accessCode: "123456",
    choreId: "c1",
  });
  expect(mockUndoChoreSubmissionForChild).toHaveBeenCalledWith({
    accessCode: "123456",
    choreId: "c1",
  });
});
```

Add a stale-undo test where undo rejects and the refresh returns `approved`:

```tsx
it("refreshes to approved when an undo loses the parent approval race", async () => {
  mockListChoresForChild
    .mockResolvedValueOnce([
      {
        id: "c1",
        title: "Make the bed",
        rewardCents: 100,
        status: "submitted",
        sentBackReason: null,
      },
    ])
    .mockResolvedValueOnce([
      {
        id: "c1",
        title: "Make the bed",
        rewardCents: 100,
        status: "approved",
        sentBackReason: null,
      },
    ]);
  mockUndoChoreSubmissionForChild.mockRejectedValue(
    new Error("Chore can no longer be moved back to To do."),
  );

  render(<ChildHomeRoute />);

  expect(await screen.findByText("waiting")).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText("Route undo"));

  await waitFor(() => {
    expect(screen.getByText("approved")).toBeOnTheScreen();
  });
  expect(mockListChoresForChild).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run the route test and verify it fails**

Run:

```bash
npm test -- --runInBand src/__tests__/child-home-route.test.tsx
```

Expected: FAIL because the route does not expose undo callbacks.

- [ ] **Step 3: Update `src/app/child/home.tsx`**

Import `undoChoreSubmissionForChild`. Remove `isDone`. Replace `onToggleChore` with:

```tsx
onSubmitChore={async (choreId) => {
  if (!accessCode) {
    throw new Error("Child access code is missing.");
  }

  const submitted = await submitChoreForChild({ accessCode, choreId });
  setChores((current) =>
    current.map((chore) => (chore.id === choreId ? submitted : chore)),
  );
}}
onUndoChore={async (choreId) => {
  if (!accessCode) {
    throw new Error("Child access code is missing.");
  }

  try {
    const assigned = await undoChoreSubmissionForChild({ accessCode, choreId });
    setChores((current) =>
      current.map((chore) => (chore.id === choreId ? assigned : chore)),
    );
  } catch (error) {
    setChores(await listChoresForChild(accessCode));
    throw error;
  }
}}
```

- [ ] **Step 4: Apply the same contract to `src/app/child/dashboard.tsx`**

Import `undoChoreSubmissionForChild`, remove `isDone`, preserve its existing data loading, and use the same submit and undo callbacks from Step 3.

- [ ] **Step 5: Run route and UI tests**

Run:

```bash
npm test -- --runInBand src/__tests__/child-home-route.test.tsx src/__tests__/kid-app.test.tsx src/__tests__/kid-home-screen.test.tsx src/__tests__/kid-chore-modal.test.tsx src/__tests__/child-chore-actions.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit route wiring**

```bash
git add src/app/child/home.tsx src/app/child/dashboard.tsx src/__tests__/child-home-route.test.tsx
git commit -m "feat(kid): wire chore submission undo"
```

### Task 6: Full Verification and Simulator Check

**Files:**
- No product files expected.

- [ ] **Step 1: Run all JavaScript tests**

Run:

```bash
npm test -- --runInBand
```

Expected: all suites pass.

- [ ] **Step 2: Run all database tests**

Run:

```bash
npm run db:test
```

Expected: all pgTAP files pass.

- [ ] **Step 3: Run static checks**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both commands exit successfully.

- [ ] **Step 4: Launch the iOS app**

First verify the current Expo process. If it is not running, start:

```bash
npm run ios
```

Expected: Metro advertises the current LAN address, the iOS simulator opens Chorey, and no red error screen appears.

- [ ] **Step 5: Verify the child flow manually**

Use a child with one assigned, one submitted, and one approved chore:

1. Tap assigned chore: modal opens; list tap alone does not submit.
2. Tap **Mark as finished**: modal changes to waiting and parent review shows the chore.
3. Tap **Undo finished**, then cancel: state remains waiting.
4. Confirm undo: state changes to todo and parent review entry disappears.
5. Open approved chore: no undo action exists.
6. Submit a chore, approve it from the parent view, then try stale undo from the child: child refreshes to approved and shows the failed transition.

- [ ] **Step 6: Inspect final diff**

Run:

```bash
git status --short
git diff --check
git log --oneline -6
```

Expected: only intentional files are changed, no whitespace errors exist, and each completed task has its own commit.
