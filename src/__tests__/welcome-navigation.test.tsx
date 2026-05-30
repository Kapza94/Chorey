import { render, screen } from "@testing-library/react-native";

import { WelcomeScreen } from "@/features/welcome/welcome-screen";

describe("WelcomeScreen navigation", () => {
  it("links parents and children to separate access flows", () => {
    render(<WelcomeScreen />);

    expect(screen.getByLabelText("Continue as parent")).toHaveProp(
      "href",
      "/parent/sign-in",
    );
    expect(screen.getByLabelText("Continue as child")).toHaveProp(
      "href",
      "/child/access",
    );
  });
});

