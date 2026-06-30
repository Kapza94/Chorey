import * as mockReact from "react";
import {
  Pressable as MockPressable,
  Text as MockText,
} from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import ChildHomeRoute from "@/app/child/home";

const mockListChoresForChild = jest.fn();
const mockSubmitChoreForChild = jest.fn();
const mockUndoChoreSubmissionForChild = jest.fn();
const mockGetBucketBalancesForChild = jest.fn();
const mockListWishlistForChild = jest.fn();
const mockListWishNotesForChild = jest.fn();
const mockAddWishNoteForChild = jest.fn();
const mockListGivingOptionsForChild = jest.fn();
const mockResolveChildAccessCode = jest.fn();
const mockSaveChildSession = jest.fn();
const mockLoadChildSession = jest.fn();
const mockClearChildSession = jest.fn();

jest.mock("expo-router", () => {
  return {
    Redirect: () => null,
    useFocusEffect: (effect: () => void | (() => void)) => {
      mockReact.useEffect(effect, [effect]);
    },
    useLocalSearchParams: () => ({
      accessCode: "123456",
      childName: "Mia",
    }),
    useRouter: () => ({ replace: jest.fn() }),
  };
});

jest.mock("@/features/children/default-child-access-actions", () => ({
  resolveChildAccessCode: (...args: unknown[]) =>
    mockResolveChildAccessCode(...args),
}));

jest.mock("@/features/children/default-child-session", () => ({
  saveChildSession: (...args: unknown[]) => mockSaveChildSession(...args),
  loadChildSession: (...args: unknown[]) => mockLoadChildSession(...args),
  clearChildSession: (...args: unknown[]) => mockClearChildSession(...args),
}));

jest.mock("@/features/game/default-game-actions", () => ({
  getGameStatsForChild: jest
    .fn()
    .mockResolvedValue({ totalPoints: 0, approvedCount: 0 }),
}));

jest.mock("@/features/kid-home/kid-app", () => ({
  KidApp: (props: {
    chores: { id: string; state: string }[];
    onSubmitChore: (id: string) => Promise<void>;
    onUndoChore: (id: string) => Promise<void>;
    wishes?: { id: string; latestNote?: { body: string } | null }[];
    onAddWishNote?: (wishId: string, body: string) => Promise<void>;
  }) => {
    return (
      <>
        <MockText>{props.chores[0]?.state ?? "empty"}</MockText>
        <MockText>{props.wishes?.[0]?.latestNote?.body ?? "no wish note"}</MockText>
        <MockPressable
          accessibilityLabel="Route submit"
          onPress={() => void props.onSubmitChore("c1")}
        />
        <MockPressable
          accessibilityLabel="Route undo"
          onPress={() => {
            void props.onUndoChore("c1").catch(() => undefined);
          }}
        />
        <MockPressable
          accessibilityLabel="Route add wish note"
          onPress={() => {
            void props.onAddWishNote?.("w1", "Please?");
          }}
        />
      </>
    );
  },
}));

jest.mock("@/features/chores/default-child-chore-actions", () => ({
  listChoresForChild: (...args: unknown[]) => mockListChoresForChild(...args),
  submitChoreForChild: (...args: unknown[]) => mockSubmitChoreForChild(...args),
  undoChoreSubmissionForChild: (...args: unknown[]) =>
    mockUndoChoreSubmissionForChild(...args),
}));

jest.mock("@/features/chores/default-child-photo-actions", () => ({
  pickChorePhoto: jest.fn(async () => null),
  uploadChorePhotoForChild: jest.fn(async () => undefined),
}));

jest.mock("@/features/ledger/default-ledger-actions", () => ({
  getBucketBalancesForChild: (...args: unknown[]) =>
    mockGetBucketBalancesForChild(...args),
}));

jest.mock("@/features/spend-wishlist/default-spend-wishlist-actions", () => ({
  createWishlistItemForChild: jest.fn(),
  listWishlistForChild: (...args: unknown[]) => mockListWishlistForChild(...args),
  listWishNotesForChild: (...args: unknown[]) => mockListWishNotesForChild(...args),
  addWishNoteForChild: (...args: unknown[]) => mockAddWishNoteForChild(...args),
  requestWishlistPurchase: jest.fn(),
}));

jest.mock("@/features/giving/default-giving-actions", () => ({
  listGivingOptionsForChild: (...args: unknown[]) =>
    mockListGivingOptionsForChild(...args),
  suggestGivingOptionForChild: jest.fn(),
}));

jest.mock("@/features/notifications/default-notification-actions", () => ({
  registerChildForPushNotifications: jest.fn(),
}));

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
  mockListWishNotesForChild.mockResolvedValue([]);
  mockAddWishNoteForChild.mockResolvedValue({
    id: "n1",
    authorKind: "child",
    authorName: "Mia",
    body: "Please?",
    createdAt: "2026-06-30T12:00:00Z",
  });
  mockListGivingOptionsForChild.mockResolvedValue([]);
  mockResolveChildAccessCode.mockResolvedValue({
    accessCode: "123456",
    childName: "Mia",
    childProfileId: "child-1",
    householdId: "household-1",
    currency: "RSD",
    paused: false,
  });
  mockLoadChildSession.mockReturnValue(null);
});

it("shows a child wish note on the wishlist row after posting it", async () => {
  mockListWishlistForChild.mockResolvedValue([
    {
      id: "w1",
      name: "Skateboard",
      targetCents: 6500,
      status: "active",
      hasUnread: false,
      unreadNoteCount: 0,
      latestNote: null,
    },
  ]);

  render(<ChildHomeRoute />);

  expect(await screen.findByText("no wish note")).toBeOnTheScreen();
  fireEvent.press(screen.getByLabelText("Route add wish note"));

  expect(await screen.findByText("Please?")).toBeOnTheScreen();
  expect(mockAddWishNoteForChild).toHaveBeenCalledWith({
    accessCode: "123456",
    wishlistItemId: "w1",
    body: "Please?",
  });
});

it("shows the neutral paused screen when the household subscription lapsed", async () => {
  mockResolveChildAccessCode.mockResolvedValue({
    accessCode: "123456",
    childName: "Mia",
    childProfileId: "child-1",
    householdId: "household-1",
    currency: "RSD",
    paused: true,
  });

  render(<ChildHomeRoute />);

  expect(
    await screen.findByText("Chorey is taking a break."),
  ).toBeOnTheScreen();
  // No prices, no subscription words, no interactive chore surface.
  expect(screen.getByText(/Ask a parent to turn it back on/)).toBeOnTheScreen();
  expect(screen.queryByLabelText("Route submit")).toBeNull();
});

it("persists the resolved session (with the household currency) on entry", async () => {
  render(<ChildHomeRoute />);

  expect(await screen.findByText("todo")).toBeOnTheScreen();
  expect(mockResolveChildAccessCode).toHaveBeenCalledWith("123456");
  expect(mockSaveChildSession).toHaveBeenCalledWith({
    accessCode: "123456",
    childName: "Mia",
    childProfileId: "child-1",
    householdId: "household-1",
    currency: "RSD",
  });
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
