import { fireEvent, render, screen } from "@testing-library/react-native";

import { ParentSectionScreen } from "@/features/parent-navigation/parent-section-screen";

describe("ParentSectionScreen", () => {
  it("shows a parent section with nav", () => {
    const onOpenDashboard = jest.fn();

    render(
      <ParentSectionScreen
        currentTab="children"
        description="Manage children and access codes."
        onOpenDashboard={onOpenDashboard}
        title="Children"
      />,
    );

    expect(screen.getByText("Children")).toBeOnTheScreen();
    expect(screen.getByText("Manage children and access codes.")).toBeOnTheScreen();
    expect(screen.getByLabelText("Children tab, selected")).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Dashboard tab"));

    expect(onOpenDashboard).toHaveBeenCalledTimes(1);
  });
});
