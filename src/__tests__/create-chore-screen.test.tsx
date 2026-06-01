import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { CreateChoreScreen } from "@/features/chores/create-chore-screen";

describe("CreateChoreScreen", () => {
  it("collects title and reward", () => {
    render(
      <CreateChoreScreen
        childName="Mina"
        childProfileId="child-1"
        householdId="household-1"
      />,
    );

    expect(screen.getAllByText("Create chore")).toHaveLength(2);
    expect(screen.getByText("For Mina")).toBeOnTheScreen();
    expect(screen.getByLabelText("Chore title")).toBeOnTheScreen();
    expect(screen.getByLabelText("Reward amount")).toBeOnTheScreen();
    expect(screen.getByText("40 / 40 / 20 preview")).toBeOnTheScreen();
    expect(screen.getByText("Spend 40%")).toBeOnTheScreen();
    expect(screen.getByText("Savings 40%")).toBeOnTheScreen();
    expect(screen.getByText("Giving 20%")).toBeOnTheScreen();
    expect(screen.queryByText("Spend 40%: 0.00")).toBeNull();
  });

  it("updates the 40 / 40 / 20 preview when reward changes", () => {
    render(
      <CreateChoreScreen
        childName="Mina"
        childProfileId="child-1"
        householdId="household-1"
      />,
    );

    fireEvent.changeText(screen.getByLabelText("Reward amount"), "10.00");

    expect(screen.getByText("Spend 40%: 4.00")).toBeOnTheScreen();
    expect(screen.getByText("Savings 40%: 4.00")).toBeOnTheScreen();
    expect(screen.getByText("Giving 20%: 2.00")).toBeOnTheScreen();
  });

  it("creates a chore and reports completion", async () => {
    const chore = {
      id: "chore-1",
      householdId: "household-1",
      childProfileId: "child-1",
      title: "Load dishwasher",
      rewardCents: 250,
      status: "assigned" as const,
    };
    const onCreateChore = jest.fn().mockResolvedValue(chore);
    const onChoreCreated = jest.fn();

    render(
      <CreateChoreScreen
        childName="Mina"
        childProfileId="child-1"
        householdId="household-1"
        onChoreCreated={onChoreCreated}
        onCreateChore={onCreateChore}
      />,
    );

    fireEvent.changeText(screen.getByLabelText("Chore title"), "Load dishwasher");
    fireEvent.changeText(screen.getByLabelText("Reward amount"), "2.50");
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Submit chore"));
    });

    await waitFor(() => {
      expect(onCreateChore).toHaveBeenCalledWith({
        householdId: "household-1",
        childProfileId: "child-1",
        title: "Load dishwasher",
        rewardCents: 250,
      });
    });
    expect(onChoreCreated).toHaveBeenCalledWith(chore);
  });
});
