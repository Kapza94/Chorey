import { fireEvent, render, screen } from "@testing-library/react-native";

import { LegalConsent } from "@/features/legal/legal-consent";
import { PRIVACY_URL, TERMS_URL } from "@/features/legal/legal";

describe("LegalConsent", () => {
  it("opens the Terms and Privacy URLs when each link is tapped", () => {
    const onOpen = jest.fn();
    render(<LegalConsent onOpen={onOpen} />);

    fireEvent.press(screen.getByLabelText("Terms of Service"));
    fireEvent.press(screen.getByLabelText("Privacy Policy"));

    expect(onOpen).toHaveBeenNthCalledWith(1, TERMS_URL);
    expect(onOpen).toHaveBeenNthCalledWith(2, PRIVACY_URL);
  });

  it("uses the supplied action verb", () => {
    render(<LegalConsent action="subscribing" onOpen={jest.fn()} />);
    expect(screen.getByText(/By subscribing, you agree/i)).toBeTruthy();
  });
});
