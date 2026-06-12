import { fireEvent, render, screen } from "@testing-library/react-native";

import { LevelUpBurst } from "@/components/level-up-burst";

describe("LevelUpBurst", () => {
  it("celebrates the kid's own level up", () => {
    render(<LevelUpBurst level={5} />);

    expect(screen.getByText("Level 5!")).toBeOnTheScreen();
    expect(screen.getByText("You leveled up.")).toBeOnTheScreen();
  });

  it("names the kid on the parent side", () => {
    render(<LevelUpBurst level={3} kidName="Mia" />);

    expect(screen.getByText("Level 3!")).toBeOnTheScreen();
    expect(screen.getByText("Mia leveled up.")).toBeOnTheScreen();
  });

  it.each(["Keep going", "Dismiss celebration"])(
    "dismisses via %s",
    (label) => {
      const onDone = jest.fn();
      render(<LevelUpBurst level={2} onDone={onDone} />);

      fireEvent.press(
        label === "Keep going"
          ? screen.getByLabelText("Keep going")
          : screen.getByLabelText("Dismiss celebration"),
      );
      expect(onDone).toHaveBeenCalled();
    },
  );
});
