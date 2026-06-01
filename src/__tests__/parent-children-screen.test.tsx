import { fireEvent, render, screen } from "@testing-library/react-native";

import { ParentChildrenScreen } from "@/features/parent-children/parent-children-screen";

describe("ParentChildrenScreen", () => {
  it("shows the current child and access code", () => {
    render(
      <ParentChildrenScreen childAccessCode="123456" childName="Mina" />,
    );

    expect(screen.getByText("Children")).toBeOnTheScreen();
    expect(screen.getByText("Mina")).toBeOnTheScreen();
    expect(screen.getByText("123456")).toBeOnTheScreen();
    expect(screen.getByLabelText("Children tab, selected")).toBeOnTheScreen();
  });

  it("starts child actions", () => {
    const onAddChild = jest.fn();
    const onOpenChildAccess = jest.fn();

    render(
      <ParentChildrenScreen
        childAccessCode="123456"
        childName="Mina"
        onAddChild={onAddChild}
        onOpenChildAccess={onOpenChildAccess}
      />,
    );

    fireEvent.press(screen.getByLabelText("Add child"));
    fireEvent.press(screen.getByLabelText("Test child access"));

    expect(onAddChild).toHaveBeenCalledTimes(1);
    expect(onOpenChildAccess).toHaveBeenCalledTimes(1);
  });
});
