import { fireEvent, render, screen } from "@testing-library/react-native";

import { ParentDashboardScreen } from "@/features/parent-dashboard/parent-dashboard-screen";

describe("ParentDashboardScreen", () => {
  it("welcomes the parent to the household dashboard", () => {
    render(<ParentDashboardScreen childName="Mina" />);

    expect(screen.getByText("Parent dashboard")).toBeOnTheScreen();
    expect(screen.getByText("Mina is ready for chores.")).toBeOnTheScreen();
  });

  it("shows the fixed 40 / 40 / 20 bucket split", () => {
    render(
      <ParentDashboardScreen
        bucketBalances={{
          givingCents: 200,
          savingsCents: 400,
          spendCents: 400,
        }}
        childName="Mina"
      />,
    );

    expect(screen.getByText("Spend")).toBeOnTheScreen();
    expect(screen.getAllByText("40%")).toHaveLength(2);
    expect(screen.getByText("Savings")).toBeOnTheScreen();
    expect(screen.getByText("Giving")).toBeOnTheScreen();
    expect(screen.getByText("20%")).toBeOnTheScreen();
    expect(screen.getAllByText("Virtual balance 4.00")).toHaveLength(2);
    expect(screen.getByText("Virtual balance 2.00")).toBeOnTheScreen();
  });

  it("starts chore creation from the dashboard", () => {
    const onCreateChore = jest.fn();

    render(<ParentDashboardScreen childName="Mina" onCreateChore={onCreateChore} />);

    fireEvent.press(screen.getByLabelText("Create chore"));

    expect(onCreateChore).toHaveBeenCalledTimes(1);
  });

  it("shows a newly created chore", () => {
    render(
      <ParentDashboardScreen
        childName="Mina"
        chores={[
          {
            id: "chore-1",
            title: "Load dishwasher",
            rewardCents: 250,
            status: "assigned",
          },
        ]}
      />,
    );

    expect(screen.getByText("Load dishwasher")).toBeOnTheScreen();
    expect(screen.getByText("2.50")).toBeOnTheScreen();
    expect(screen.getByText("Waiting on child")).toBeOnTheScreen();
    expect(screen.getByText("Ready for Mina to complete")).toBeOnTheScreen();
  });

  it("approves a submitted chore", () => {
    const onApproveChore = jest.fn();

    render(
      <ParentDashboardScreen
        childName="Mina"
        chores={[
          {
            id: "chore-1",
            title: "Load dishwasher",
            rewardCents: 250,
            status: "submitted",
          },
        ]}
        onApproveChore={onApproveChore}
      />,
    );

    fireEvent.press(screen.getByLabelText("Approve Load dishwasher"));

    expect(screen.getByText("Needs approval")).toBeOnTheScreen();
    expect(screen.getByText("Parent check needed")).toBeOnTheScreen();
    expect(onApproveChore).toHaveBeenCalledWith("chore-1");
  });

  it("shows and approves purchase requests", () => {
    const onApprovePurchaseRequest = jest.fn();

    render(
      <ParentDashboardScreen
        childName="Mina"
        onApprovePurchaseRequest={onApprovePurchaseRequest}
        purchaseRequests={[
          {
            childName: "Mina",
            id: "request-1",
            itemName: "Football",
            status: "pending",
            targetCents: 2500,
            wishlistItemId: "wish-1",
          },
        ]}
      />,
    );

    expect(screen.getByText("Purchase requests")).toBeOnTheScreen();
    expect(screen.getByText("Football")).toBeOnTheScreen();
    expect(screen.getByText("25.00")).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Approve purchase Football"));

    expect(onApprovePurchaseRequest).toHaveBeenCalledWith("request-1");
  });

  it("shows approved chores as settled into the split", () => {
    render(
      <ParentDashboardScreen
        childName="Mina"
        chores={[
          {
            id: "chore-1",
            title: "Load dishwasher",
            rewardCents: 250,
            status: "approved",
          },
        ]}
      />,
    );

    expect(screen.getByText("Approved")).toBeOnTheScreen();
    expect(screen.getByText("Settled into 40 / 40 / 20")).toBeOnTheScreen();
  });

  it("shows the child access code when present", () => {
    render(<ParentDashboardScreen childAccessCode="123456" childName="Mina" />);

    expect(screen.getByText("Child access code")).toBeOnTheScreen();
    expect(screen.getByText("123456")).toBeOnTheScreen();
  });

  it("opens child access from the dashboard", () => {
    const onOpenChildAccess = jest.fn();

    render(
      <ParentDashboardScreen
        childAccessCode="123456"
        childName="Mina"
        onOpenChildAccess={onOpenChildAccess}
      />,
    );

    fireEvent.press(screen.getByLabelText("Test child access"));

    expect(onOpenChildAccess).toHaveBeenCalledTimes(1);
  });
});
