import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import {
  ToyAvatar,
  ToyButton,
  ToyCard,
  ToyProgressBar,
  ToySticker,
} from "@/components/toybox";

describe("toybox primitives", () => {
  it("ToyCard renders its children", () => {
    render(
      <ToyCard>
        <Text>tile content</Text>
      </ToyCard>,
    );
    expect(screen.getByText("tile content")).toBeOnTheScreen();
  });

  it("ToySticker shows its label", () => {
    render(<ToySticker label="2 waiting for your OK" />);
    expect(screen.getByText("2 waiting for your OK")).toBeOnTheScreen();
  });

  it("ToyButton fires onPress", () => {
    const onPress = jest.fn();
    render(<ToyButton onPress={onPress}>Approve</ToyButton>);
    fireEvent.press(screen.getByText("Approve"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("ToyButton ignores presses while disabled", () => {
    const onPress = jest.fn();
    render(
      <ToyButton onPress={onPress} disabled>
        Continue
      </ToyButton>,
    );
    fireEvent.press(screen.getByText("Continue"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("ToyAvatar shows the kid's initial", () => {
    render(<ToyAvatar name="djole" tone="savings" />);
    expect(screen.getByText("D")).toBeOnTheScreen();
  });

  it("ToyProgressBar clamps and reports its value", () => {
    render(<ToyProgressBar ratio={1.7} />);
    expect(screen.getByRole("progressbar").props.accessibilityValue).toEqual({
      now: 100,
      min: 0,
      max: 100,
    });
  });
});
