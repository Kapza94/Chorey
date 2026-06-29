import { Text } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import IndexRoute from "@/app/index";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockGetSession = jest.fn();
const mockGetPrimaryHouseholdId = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: mockReplace,
};

function MockOnboardingFlow() {
  return <Text>Onboarding flow</Text>;
}

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
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

const mockLoadChildSession = jest.fn();

jest.mock("@/features/children/default-child-session", () => ({
  loadChildSession: (...args: unknown[]) => mockLoadChildSession(...args),
  saveChildSession: jest.fn(),
  clearChildSession: jest.fn(),
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
    mockGetSession.mockReset();
    mockGetPrimaryHouseholdId.mockReset();
    mockLoadChildSession.mockReturnValue(null);
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

  it("resumes onboarding for a signed-in parent without a household", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "parent-1" } } },
      error: null,
    });
    mockGetPrimaryHouseholdId.mockResolvedValue(null);

    render(<IndexRoute />);

    await waitFor(() => {
      expect(screen.getByText("Onboarding flow")).toBeOnTheScreen();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("restores a remembered kid to the kid app", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockLoadChildSession.mockReturnValue({
      accessCode: "123456",
      childName: "Mia",
      childProfileId: "child-1",
      householdId: "household-1",
      currency: "USD",
    });

    render(<IndexRoute />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/child/home");
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

  it("shows a retry action when the session check fails", async () => {
    mockGetSession
      .mockResolvedValueOnce({
        data: { session: null },
        error: new Error("Network request failed"),
      })
      .mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

    render(<IndexRoute />);

    await waitFor(() => {
      expect(screen.getByText("Couldn't start Chorey")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByLabelText("Retry launch"));

    await waitFor(() => {
      expect(screen.getByText("Onboarding flow")).toBeOnTheScreen();
    });

    expect(mockGetSession).toHaveBeenCalledTimes(2);
  });

  it("shows a retry action when household resolution fails", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "parent-1" } } },
      error: null,
    });
    mockGetPrimaryHouseholdId.mockRejectedValue(
      new Error("Network request failed"),
    );

    render(<IndexRoute />);

    await waitFor(() => {
      expect(screen.getByText("Couldn't start Chorey")).toBeOnTheScreen();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
