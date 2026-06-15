import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { DeleteAccountConfirm } from "@/features/account/delete-account-confirm";

describe("DeleteAccountConfirm", () => {
  it("spells out the consequences and offers a way back", () => {
    const onBack = jest.fn();
    render(<DeleteAccountConfirm onConfirm={jest.fn()} onBack={onBack} />);

    expect(screen.getByText(/permanently deletes your household/i)).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Cancel"));
    expect(onBack).toHaveBeenCalled();
  });

  it("runs the deletion when confirmed", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(<DeleteAccountConfirm onConfirm={onConfirm} onBack={jest.fn()} />);

    fireEvent.press(screen.getByLabelText("Delete my account"));
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
  });

  it("surfaces an error and stays put on failure", async () => {
    const onConfirm = jest.fn().mockRejectedValue(new Error("Couldn't reach the server"));
    render(<DeleteAccountConfirm onConfirm={onConfirm} onBack={jest.fn()} />);

    fireEvent.press(screen.getByLabelText("Delete my account"));
    expect(await screen.findByText("Couldn't reach the server")).toBeTruthy();
  });
});
