import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { DevRoleSwitcher } from "@/features/dev/dev-role-switcher";

const mockReplace = jest.fn();
const mockGetPrimaryHouseholdId = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("@/features/household/default-household-actions", () => ({
  getPrimaryHouseholdId: (...args: unknown[]) =>
    mockGetPrimaryHouseholdId(...args),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("DevRoleSwitcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("explains why parent switching cannot continue without a household", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation();
    mockGetPrimaryHouseholdId.mockResolvedValue(null);

    render(<DevRoleSwitcher />);
    fireEvent.press(screen.getByLabelText("Dev view as parent"));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith(
        "No household",
        "Log in as a parent first.",
      );
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
