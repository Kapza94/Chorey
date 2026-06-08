import { Text } from "react-native";
import { render, screen, waitFor } from "@testing-library/react-native";

import IndexRoute from "@/app/index";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockGetSession = jest.fn();
const mockGetPrimaryHouseholdId = jest.fn();

function MockOnboardingFlow() {
  return <Text>Onboarding flow</Text>;
}

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

jest.mock("@/features/household/default-household-actions", () => ({
  getPrimaryHouseholdId: (...args: unknown[]) =>
    mockGetPrimaryHouseholdId(...args),
}));

jest.mock("@/features/auth/default-parent-auth-actions", () => ({
  createDefaultParentAuthActions: () => ({
    sendMagicLink: jest.fn(),
    verifyEmailOtp: jest.fn(),
  }),
}));

jest.mock("@/features/onboarding/default-onboarding-persistence", () => ({
  persistOnboardingForSignedInParent: jest.fn(),
}));

jest.mock("@/features/onboarding/onboarding-flow", () => ({
  OnboardingFlow: MockOnboardingFlow,
}));

describe("IndexRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("routes a signed-in parent with a household to parent home", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "parent-1" } } },
      error: null,
    });
    mockGetPrimaryHouseholdId.mockResolvedValue("household-1");

    render(<IndexRoute />);

    expect(screen.queryByText("Onboarding flow")).not.toBeOnTheScreen();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/parent/home",
        params: { householdId: "household-1" },
      });
    });
  });

  it("routes a signed-in parent without a household to household setup", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "parent-1" } } },
      error: null,
    });
    mockGetPrimaryHouseholdId.mockResolvedValue(null);

    render(<IndexRoute />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/parent/household/new");
    });
  });

  it("shows onboarding when no parent session exists", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<IndexRoute />);

    await waitFor(() => {
      expect(screen.getByText("Onboarding flow")).toBeOnTheScreen();
    });

    expect(mockGetPrimaryHouseholdId).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
