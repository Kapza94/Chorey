import { fireEvent, render, screen } from "@testing-library/react-native";

import { ParentSettingsScreen } from "@/features/parent-settings/parent-settings-screen";

describe("ParentSettingsScreen", () => {
  it("shows household and plan settings", () => {
    render(
      <ParentSettingsScreen
        childName="Mina"
        householdId="household-1"
      />,
    );

    expect(screen.getByText("Settings")).toBeOnTheScreen();
    expect(screen.getByText("Household")).toBeOnTheScreen();
    expect(screen.getByText("household-1")).toBeOnTheScreen();
    expect(screen.getByText("Mina")).toBeOnTheScreen();
    expect(screen.getByText("Plan")).toBeOnTheScreen();
    expect(screen.getByLabelText("Settings tab, selected")).toBeOnTheScreen();
  });

  it("opens upgrade options", () => {
    const onOpenUpgrade = jest.fn();

    render(<ParentSettingsScreen onOpenUpgrade={onOpenUpgrade} />);

    fireEvent.press(screen.getByLabelText("Open upgrade options"));

    expect(onOpenUpgrade).toHaveBeenCalledTimes(1);
  });
});
