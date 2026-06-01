import { fireEvent, render, screen } from "@testing-library/react-native";

import { ParentTabBar } from "@/features/parent-navigation/parent-tab-bar";

describe("ParentTabBar", () => {
  it("marks the current parent tab", () => {
    render(<ParentTabBar currentTab="dashboard" />);

    expect(screen.getByTestId("parent-tab-bar")).toHaveStyle({
      borderWidth: 0,
    });
    expect(screen.getByLabelText("Dashboard tab, selected")).toBeOnTheScreen();
    expect(screen.getByLabelText("Chores tab")).toBeOnTheScreen();
    expect(screen.getByLabelText("Children tab")).toBeOnTheScreen();
    expect(screen.getByLabelText("Settings tab")).toBeOnTheScreen();
    expect(screen.queryByText("Home")).toBeNull();
    expect(screen.queryByText("Chores")).toBeNull();
    expect(screen.queryByText("Children")).toBeNull();
    expect(screen.queryByText("Settings")).toBeNull();
  });

  it("keeps icons directly in borderless tab buttons", () => {
    render(<ParentTabBar currentTab="dashboard" />);

    expect(screen.getByTestId("dashboard-tab-button")).toHaveStyle({
      backgroundColor: "transparent",
      borderWidth: 0,
      height: 64,
    });
  });

  it("opens parent sections", () => {
    const onOpenChores = jest.fn();
    const onOpenChildren = jest.fn();
    const onOpenSettings = jest.fn();

    render(
      <ParentTabBar
        currentTab="dashboard"
        onOpenChildren={onOpenChildren}
        onOpenChores={onOpenChores}
        onOpenSettings={onOpenSettings}
      />,
    );

    fireEvent.press(screen.getByLabelText("Chores tab"));
    fireEvent.press(screen.getByLabelText("Children tab"));
    fireEvent.press(screen.getByLabelText("Settings tab"));

    expect(onOpenChores).toHaveBeenCalledTimes(1);
    expect(onOpenChildren).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
