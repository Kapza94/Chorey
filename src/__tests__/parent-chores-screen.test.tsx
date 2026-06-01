import { fireEvent, render, screen } from "@testing-library/react-native";

import { ParentChoresScreen } from "@/features/parent-chores/parent-chores-screen";

describe("ParentChoresScreen", () => {
  it("shows chores with reward and state", () => {
    render(
      <ParentChoresScreen
        childName="Mina"
        chores={[
          {
            id: "chore-1",
            childProfileId: "child-1",
            householdId: "household-1",
            rewardCents: 250,
            status: "assigned",
            title: "Load dishwasher",
          },
        ]}
      />,
    );

    expect(screen.getByText("Chores")).toBeOnTheScreen();
    expect(screen.getByText("Load dishwasher")).toBeOnTheScreen();
    expect(screen.getByText("2.50")).toBeOnTheScreen();
    expect(screen.getByText("Waiting on child")).toBeOnTheScreen();
    expect(screen.getByLabelText("Chores tab, selected")).toBeOnTheScreen();
  });

  it("starts chore creation", () => {
    const onCreateChore = jest.fn();

    render(<ParentChoresScreen childName="Mina" onCreateChore={onCreateChore} />);

    fireEvent.press(screen.getByLabelText("Create chore"));

    expect(onCreateChore).toHaveBeenCalledTimes(1);
  });
});
