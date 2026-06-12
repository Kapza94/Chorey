import { MAX_LEVEL } from "@/features/game/leveling";

/**
 * Geometry for the level road — a serpentine path climbing from level 1 at
 * the bottom of the map to level 100 at the top. Pure math, so the screen
 * stays dumb and the layout is testable.
 */

export const NODE_SPACING = 104;
export const MAP_PADDING_Y = 140;
/** how far the road swings left/right, as a fraction of map width */
const AMPLITUDE = 0.3;
/** radians advanced per level along the serpentine */
const WAVE = 0.52;

export type MapPoint = { x: number; y: number };

export function mapHeight(): number {
  return (MAX_LEVEL - 1) * NODE_SPACING + MAP_PADDING_Y * 2;
}

/** Center of a level's node. Level 1 sits at the bottom, 100 at the top. */
export function nodePosition(level: number, mapWidth: number): MapPoint {
  const clamped = Math.min(Math.max(level, 1), MAX_LEVEL);
  return {
    x: mapWidth / 2 + Math.sin(clamped * WAVE) * mapWidth * AMPLITUDE,
    y: MAP_PADDING_Y + (MAX_LEVEL - clamped) * NODE_SPACING,
  };
}

/** Dotted road points between two consecutive levels (exclusive of nodes). */
export function roadDots(
  fromLevel: number,
  mapWidth: number,
  dotsPerSegment = 3,
): MapPoint[] {
  const a = nodePosition(fromLevel, mapWidth);
  const b = nodePosition(fromLevel + 1, mapWidth);
  return Array.from({ length: dotsPerSegment }, (_, i) => {
    const t = (i + 1) / (dotsPerSegment + 1);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  });
}

/** The car's waypoints when driving from one level to another (inclusive). */
export function drivePath(
  fromLevel: number,
  toLevel: number,
  mapWidth: number,
): MapPoint[] {
  const start = Math.min(Math.max(fromLevel, 1), MAX_LEVEL);
  const end = Math.min(Math.max(toLevel, 1), MAX_LEVEL);
  if (end <= start) return [nodePosition(end, mapWidth)];
  const points: MapPoint[] = [];
  for (let level = start; level <= end; level++) {
    points.push(nodePosition(level, mapWidth));
  }
  return points;
}
