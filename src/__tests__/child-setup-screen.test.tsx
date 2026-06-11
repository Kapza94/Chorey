import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ChildSetupScreen } from "@/features/children/child-setup-screen";

describe("ChildSetupScreen", () => {
  it("collects a child name", () => {
    render(<ChildSetupScreen householdId="household-1" />);

    expect(screen.getAllByText("Add child")).toHaveLength(2);
    expect(screen.queryByText("Add your first child")).toBeNull();
    expect(screen.getByLabelText("Child name")).toBeOnTheScreen();
  });

  it("calls back from the setup header", () => {
    const onBack = jest.fn();

    render(<ChildSetupScreen householdId="household-1" onBack={onBack} />);

    fireEvent.press(screen.getByLabelText("Go back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("creates the child and reports completion", async () => {
    const onCreateChild = jest.fn().mockResolvedValue({
      id: "child-1",
      displayName: "Mina",
      householdId: "household-1",
    });
    const onChildCreated = jest.fn();

    render(
      <ChildSetupScreen
        householdId="household-1"
        onChildCreated={onChildCreated}
        onCreateChild={onCreateChild}
      />,
    );

    fireEvent.changeText(screen.getByLabelText("Child name"), "Mina");
    fireEvent.press(screen.getByLabelText("Submit child setup"));

    await waitFor(() => {
      expect(onCreateChild).toHaveBeenCalledWith({
        householdId: "household-1",
        displayName: "Mina",
      });
    });
    expect(onChildCreated).toHaveBeenCalledWith({
      id: "child-1",
      displayName: "Mina",
      householdId: "household-1",
    });
  });

  it("shows the subscription notice when the household is paused", async () => {
    const onCreateChild = jest
      .fn()
      .mockRejectedValue(
        new Error("Chorey is paused. Resume your subscription to add another child."),
      );
    const onUpgrade = jest.fn();

    render(
      <ChildSetupScreen
        householdId="household-1"
        onCreateChild={onCreateChild}
        onUpgrade={onUpgrade}
      />,
    );

    fireEvent.changeText(screen.getByLabelText("Child name"), "Leo");
    fireEvent.press(screen.getByLabelText("Submit child setup"));

    expect(await screen.findByText("Chorey is paused")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("View subscription"));

    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });
});
