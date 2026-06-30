import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { KidWishlistScreen, type KidWish } from "@/features/kid-home/kid-wishlist-screen";
import type { WishNote } from "@/features/spend-wishlist/spend-wishlist-actions";

const wish: KidWish = {
  id: "w1",
  name: "Skateboard",
  targetCents: 6500,
  status: "active",
};

describe("KidWishlistScreen · notes", () => {
  it("flags a wish with an unseen parent note", () => {
    render(<KidWishlistScreen wishes={[{ ...wish, hasUnread: true }]} />);

    expect(screen.getByLabelText("Notes for Skateboard, 1 new message")).toBeOnTheScreen();
  });

  it("shows the number of unseen parent notes on the notes button", () => {
    render(<KidWishlistScreen wishes={[{ ...wish, hasUnread: true, unreadNoteCount: 3 }]} />);

    expect(screen.getByLabelText("Notes for Skateboard, 3 new messages")).toBeOnTheScreen();
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the latest note on the wishlist row", () => {
    render(
      <KidWishlistScreen
        wishes={[
          {
            ...wish,
            latestNote: {
              authorKind: "parent",
              body: "Finish your chores first",
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("Parent: Finish your chores first")).toBeOnTheScreen();
  });

  it("opens a wish's thread, posts a note, and closes", async () => {
    const onOpenNotes = jest.fn();
    const onAddNote = jest.fn();
    const notes: WishNote[] = [
      {
        id: "n1",
        authorKind: "parent",
        authorName: "Dad",
        body: "Finish your chores first",
        createdAt: "2026-06-25T10:00:00Z",
      },
    ];

    render(
      <KidWishlistScreen
        wishes={[wish]}
        notes={notes}
        onOpenNotes={onOpenNotes}
        onAddNote={onAddNote}
      />,
    );

    fireEvent.press(screen.getByLabelText("Notes for Skateboard"));
    expect(onOpenNotes).toHaveBeenCalledWith("w1");
    // The parent's note shows in the thread.
    expect(screen.getByText("Finish your chores first")).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText("Write a note"), "  Please? ");
    fireEvent.press(screen.getByLabelText("Send note"));
    expect(onAddNote).toHaveBeenCalledWith("w1", "Please?");
    await waitFor(() => {
      expect(screen.queryByLabelText("Write a note")).toBeNull();
    });
  });
});
