import { fireEvent, render, screen } from "@testing-library/react-native";

import { UpgradeScreen } from "@/features/upgrade/upgrade-screen";

describe("UpgradeScreen", () => {
  it("explains Plus features for parents", () => {
    render(<UpgradeScreen />);

    expect(screen.getByText("Chorey Plus")).toBeOnTheScreen();
    expect(screen.getByText("Back to dashboard")).toBeOnTheScreen();
    expect(screen.getByText("Multiple children")).toBeOnTheScreen();
    expect(screen.getByText("Recurring chores")).toBeOnTheScreen();
    expect(screen.getByText("Photo proof")).toBeOnTheScreen();
  });

  it("calls back from the close action", () => {
    const onClose = jest.fn();

    render(<UpgradeScreen onClose={onClose} />);

    fireEvent.press(screen.getByLabelText("Close upgrade options"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
