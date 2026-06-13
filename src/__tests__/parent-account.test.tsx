import { fireEvent, render, screen } from "@testing-library/react-native";

import { ToyAvatar } from "@/components/toybox";
import {
  AccountAvatarButton,
  ParentAccountSheet,
  type ParentAccount,
} from "@/features/parent-app/parent-account";

const account: ParentAccount = {
  name: "Kapza 94",
  email: "luka.kapetanovic@gmail.com",
  provider: "google",
  avatarUrl: "https://lh3.googleusercontent.com/a/photo",
  householdName: "Kapza home",
};

describe("ToyAvatar", () => {
  it("shows the initial when there is no photo", () => {
    render(<ToyAvatar name="Mia" />);
    expect(screen.getByText("M")).toBeOnTheScreen();
  });

  it("shows the photo (not the initial) when an imageUrl is given", () => {
    render(<ToyAvatar name="Mia" imageUrl="https://example.com/a.png" />);
    expect(screen.queryByText("M")).toBeNull();
  });
});

describe("AccountAvatarButton", () => {
  it("opens the account on press", () => {
    const onPress = jest.fn();
    render(<AccountAvatarButton account={account} onPress={onPress} />);
    fireEvent.press(screen.getByLabelText("Your account"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("ParentAccountSheet", () => {
  function setup(overrides: Partial<React.ComponentProps<typeof ParentAccountSheet>> = {}) {
    const props = {
      visible: true,
      account,
      subscriptionLabel: "Free trial",
      onEditName: jest.fn(),
      onManageSubscription: jest.fn(),
      onSignOut: jest.fn(),
      onClose: jest.fn(),
      ...overrides,
    };
    render(<ParentAccountSheet {...props} />);
    return props;
  }

  it("shows identity, household, and provider", () => {
    setup();
    expect(screen.getByText("Kapza 94")).toBeOnTheScreen();
    expect(screen.getByText("luka.kapetanovic@gmail.com")).toBeOnTheScreen();
    expect(screen.getByText("Kapza home")).toBeOnTheScreen();
    expect(screen.getByText("Google")).toBeOnTheScreen();
  });

  it("signs out", () => {
    const props = setup();
    fireEvent.press(screen.getByLabelText("Sign out"));
    expect(props.onSignOut).toHaveBeenCalledTimes(1);
  });

  it("opens the existing subscription screen rather than duplicating it", () => {
    const props = setup();
    fireEvent.press(screen.getByLabelText("Account & subscription"));
    expect(props.onManageSubscription).toHaveBeenCalledTimes(1);
  });

  it("edits the display name", () => {
    const props = setup();
    fireEvent.press(screen.getByLabelText("Edit profile"));
    fireEvent.changeText(screen.getByLabelText("Your name"), "Luka K");
    fireEvent.press(screen.getByLabelText("Save name"));
    expect(props.onEditName).toHaveBeenCalledWith("Luka K");
  });
});
