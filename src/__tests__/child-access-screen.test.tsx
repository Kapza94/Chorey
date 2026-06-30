import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { ChildAccessScreen } from "@/features/auth/child-access-screen";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe("ChildAccessScreen", () => {
  it("collects a child access code", () => {
    render(<ChildAccessScreen />);

    expect(screen.getByText("Enter your code.")).toBeOnTheScreen();
    expect(screen.getByLabelText("Access code")).toBeOnTheScreen();
  });

  it("goes back from child access", () => {
    const onBack = jest.fn();

    render(<ChildAccessScreen onBack={onBack} />);

    fireEvent.press(screen.getByLabelText("Back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("resolves the child and reports access", async () => {
    const child = {
      accessCode: "123456",
      childProfileId: "child-1",
      childName: "Mina",
      householdId: "household-1",
      currency: "USD" as const,
    };
    const onResolveAccessCode = jest.fn().mockResolvedValue(child);
    const onChildAccess = jest.fn();

    render(
      <ChildAccessScreen
        onChildAccess={onChildAccess}
        onResolveAccessCode={onResolveAccessCode}
      />,
    );

    fireEvent.changeText(screen.getByLabelText("Access code"), "123 456");
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Continue as child"));
    });

    await waitFor(() => {
      expect(onResolveAccessCode).toHaveBeenCalledWith("123 456");
    });
    expect(onChildAccess).toHaveBeenCalledWith(child);
  });
});
