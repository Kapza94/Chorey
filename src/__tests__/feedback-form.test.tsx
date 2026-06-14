import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { FeedbackForm } from "@/features/feedback/feedback-form";

describe("FeedbackForm", () => {
  it("shows copy for the chosen kind", () => {
    render(<FeedbackForm kind="feedback" onSubmit={jest.fn()} />);
    expect(screen.getByText(/comes straight to the team/i)).toBeTruthy();
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeTruthy();
  });

  it("does not submit an empty message", () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<FeedbackForm kind="contact" onSubmit={onSubmit} />);
    fireEvent.press(screen.getByLabelText("Send request"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the message and shows a thank-you", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<FeedbackForm kind="feedback" onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText("Send feedback message"), "  Great app  ");
    fireEvent.press(screen.getByLabelText("Send feedback"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("  Great app  "));
    expect(await screen.findByText("Thank you!")).toBeTruthy();
  });

  it("surfaces a submit error and stays on the form", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("Network down"));
    render(<FeedbackForm kind="contact" onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByLabelText("Contact us message"), "Help please");
    fireEvent.press(screen.getByLabelText("Send request"));

    expect(await screen.findByText("Network down")).toBeTruthy();
    expect(screen.queryByText("Thank you!")).toBeNull();
  });
});
