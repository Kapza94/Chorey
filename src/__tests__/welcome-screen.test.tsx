import { render, screen } from "@testing-library/react-native";

import { WelcomeScreen } from "@/features/welcome/welcome-screen";

describe("WelcomeScreen", () => {
  it("introduces Chorey and the 40 / 40 / 20 split", () => {
    render(<WelcomeScreen />);

    expect(screen.getByText("Chorey")).toBeOnTheScreen();
    expect(screen.getByText("Every chore teaches money habits.")).toBeOnTheScreen();
    expect(screen.getByText("40 / 40 / 20")).toBeOnTheScreen();
  });

  it("offers separate parent and child entry points", () => {
    render(<WelcomeScreen />);

    expect(screen.getByText("Parent")).toBeOnTheScreen();
    expect(screen.getByText("Child")).toBeOnTheScreen();
  });
});

