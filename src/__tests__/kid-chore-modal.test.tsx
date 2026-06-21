import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { KidChoreModal } from "@/features/kid-home/kid-chore-modal";

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

  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("c1", null));
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

  expect(await screen.findByText("Network request failed")).toBeOnTheScreen();
  expect(screen.getByText("Make the bed")).toBeOnTheScreen();
});

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
