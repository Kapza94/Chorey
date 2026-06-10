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
const mockListGivingOptionsForChild = jest.fn();

jest.mock("expo-router", () => {
  return {
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

jest.mock("@/features/kid-home/kid-app", () => ({
  KidApp: (props: {
    chores: { id: string; state: string }[];
    onSubmitChore: (id: string) => Promise<void>;
    onUndoChore: (id: string) => Promise<void>;
  }) => {
    return (
      <>
        <MockText>{props.chores[0]?.state ?? "empty"}</MockText>
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
