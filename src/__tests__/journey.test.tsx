import { fireEvent, render, screen } from "@testing-library/react-native";

import {
  MAP_PADDING_Y,
  drivePath,
  mapHeight,
  nodePosition,
  roadDots,
} from "@/features/game/journey-geometry";
import { MAX_LEVEL } from "@/features/game/leveling";
import { KidJourneyScreen } from "@/features/kid-home/kid-journey-screen";
import { KidApp } from "@/features/kid-home/kid-app";

const WIDTH = 390;

describe("journey geometry", () => {
  it("climbs: higher levels sit higher on the map", () => {
    const low = nodePosition(1, WIDTH);
    const mid = nodePosition(50, WIDTH);
    const top = nodePosition(MAX_LEVEL, WIDTH);
    expect(low.y).toBeGreaterThan(mid.y);
    expect(mid.y).toBeGreaterThan(top.y);
    expect(top.y).toBe(MAP_PADDING_Y);
  });

  it("keeps the serpentine inside the map width", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      const { x } = nodePosition(level, WIDTH);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(WIDTH);
    }
  });

  it("lays dotted road between consecutive levels", () => {
    const dots = roadDots(4, WIDTH);
    expect(dots).toHaveLength(3);
    const a = nodePosition(4, WIDTH);
    const b = nodePosition(5, WIDTH);
    for (const dot of dots) {
      expect(dot.y).toBeLessThan(a.y);
      expect(dot.y).toBeGreaterThan(b.y);
    }
  });

  it("drives level by level, inclusive of the destination", () => {
    expect(drivePath(3, 6, WIDTH)).toHaveLength(4);
    // no drive when already parked at (or past) the destination
    expect(drivePath(6, 6, WIDTH)).toHaveLength(1);
    expect(drivePath(9, 6, WIDTH)).toHaveLength(1);
  });

  it("sizes the map for all 100 levels", () => {
    expect(mapHeight()).toBeGreaterThan(nodePosition(1, WIDTH).y);
  });
});

describe("KidJourneyScreen", () => {
  it("shows the road with the current level and milestones", () => {
    render(<KidJourneyScreen visible level={12} onClose={jest.fn()} />);

    expect(screen.getByText("Level 12 of 100.")).toBeOnTheScreen();
    expect(screen.getByTestId("journey-car")).toBeOnTheScreen();
    expect(screen.getByText("halfway hero")).toBeOnTheScreen();
    expect(screen.getByText("LEGEND")).toBeOnTheScreen();
  });

  it("closes", () => {
    const onClose = jest.fn();
    render(<KidJourneyScreen visible level={3} onClose={onClose} />);

    fireEvent.press(screen.getByLabelText("Close the level road"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("KidApp journey entry", () => {
  it("opens the level road from the home level row", () => {
    render(<KidApp name="Mia" totalPoints={15} />);

    expect(screen.queryByText(/of 100\./)).toBeNull();
    fireEvent.press(screen.getByLabelText("Open your level road"));

    // 15 points → level 2
    expect(screen.getByText("Level 2 of 100.")).toBeOnTheScreen();
  });
});
