import { fireEvent, render, screen } from "@testing-library/react-native";

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

    expect(screen.getByLabelText("Notes for Skateboard, new message")).toBeOnTheScreen();
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

  it("opens a wish's thread and posts a note", () => {
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
  });
});
