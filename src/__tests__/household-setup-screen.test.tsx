import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { HouseholdSetupScreen } from "@/features/household/household-setup-screen";

describe("HouseholdSetupScreen", () => {
  it("collects household name and settlement frequency", () => {
    render(<HouseholdSetupScreen />);

    expect(screen.getAllByText("Create household")).toHaveLength(2);
    expect(screen.getByLabelText("Household name")).toBeOnTheScreen();
    expect(screen.getByText("Weekly")).toBeOnTheScreen();
    expect(screen.getByText("Monthly")).toBeOnTheScreen();
  });

  it("calls back from the setup header", () => {
    const onBack = jest.fn();

    render(<HouseholdSetupScreen onBack={onBack} />);

    fireEvent.press(screen.getByLabelText("Go back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("submits the selected monthly settlement frequency", async () => {
    const onCreateHousehold = jest.fn();

    render(<HouseholdSetupScreen onCreateHousehold={onCreateHousehold} />);

    fireEvent.changeText(screen.getByLabelText("Household name"), "Kapza home");
    fireEvent.press(screen.getByText("Monthly"));
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Submit household setup"));
    });

    expect(onCreateHousehold).toHaveBeenCalledWith({
      name: "Kapza home",
      settlementFrequency: "monthly",
    });
  });

  it("reports the created household after submission", async () => {
    const household = { id: "household-1", name: "Kapza home" };
    const onCreateHousehold = jest.fn().mockResolvedValue(household);
    const onHouseholdCreated = jest.fn();

    render(
      <HouseholdSetupScreen
        onCreateHousehold={onCreateHousehold}
        onHouseholdCreated={onHouseholdCreated}
      />,
    );

    fireEvent.changeText(screen.getByLabelText("Household name"), "Kapza home");
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Submit household setup"));
    });

    await waitFor(() => {
      expect(onHouseholdCreated).toHaveBeenCalledWith(household);
    });
  });

  it("shows useful messages from Supabase-style errors", async () => {
    const onCreateHousehold = jest.fn().mockRejectedValue({
      message: "new row violates row-level security policy",
    });

    render(<HouseholdSetupScreen onCreateHousehold={onCreateHousehold} />);

    fireEvent.changeText(screen.getByLabelText("Household name"), "Kapza home");
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Submit household setup"));
    });

    expect(
      screen.getByText("new row violates row-level security policy"),
    ).toBeOnTheScreen();
  });
});
