import { ScrollView, Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { OBShell, OBTitle } from "@/features/onboarding/onboarding-kit";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe("OBShell", () => {
  it("keeps the page title outside the scrollable body", () => {
    const { UNSAFE_getByType } = render(
      <OBShell>
        <OBTitle title="Fixed title" subtitle="Fixed subtitle" />
        <Text>Scrollable body</Text>
      </OBShell>,
    );

    const scrollView = UNSAFE_getByType(ScrollView);

    expect(screen.getByText("Fixed title")).toBeOnTheScreen();
    expect(scrollView.findAllByProps({ children: "Fixed title" })).toHaveLength(0);
    expect(scrollView.findAllByProps({ children: "Fixed subtitle" })).toHaveLength(0);
    expect(scrollView.findAllByProps({ children: "Scrollable body" }).length).toBeGreaterThan(0);
  });
});
