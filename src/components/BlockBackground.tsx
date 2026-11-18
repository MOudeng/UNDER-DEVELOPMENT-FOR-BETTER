import { type ReactElement, useMemo, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Polygon, Rect } from "react-native-svg";

import { type CellType, randomPatternCells } from "../data/patternCells";

const TILE = 72; // smallest tile: one 2x2 pattern
const GAP = 10;
const CELL = TILE / 2;
const RED = "#f45023";

const cellShape = (
  type: CellType,
  x: number,
  y: number,
  key: string,
  color = RED,
  cell = CELL,
) => {
  const [r, b] = [x + cell, y + cell];
  const points: Record<Exclude<CellType, "R" | "W">, string> = {
    tl: `${x},${y} ${r},${y} ${x},${b}`,
    tr: `${x},${y} ${r},${y} ${r},${b}`,
    bl: `${x},${y} ${x},${b} ${r},${b}`,
    br: `${r},${y} ${r},${b} ${x},${b}`,
  };
  if (type === "W") return null;
  if (type === "R") return <Rect key={key} x={x} y={y} width={cell} height={cell} fill={color} />;
  return <Polygon key={key} points={points[type]} fill={color} />;
};

export type BackgroundLayout = "zigzag" | "x" | "horizontal";
export const BACKGROUND_LAYOUTS: BackgroundLayout[] = ["zigzag", "x", "horizontal"];

type Props = {
  /** Omit both to get a random pattern and arrangement, fixed for this screen visit. */
  cells?: CellType[];
  layout?: BackgroundLayout;
  opacity?: number;
  /** White on the red gradient screens, orange on the light ones. */
  color?: string;
};

/** Top-left corner of every tile, for one of three arrangements. */
const tilePositions = (layout: BackgroundLayout, width: number, height: number, tile: number) => {
  const step = tile + GAP;
  const columns = Math.ceil(width / step);
  const rows = Math.ceil(height / step) + 1;
  const positions: [number, number][] = [];

  if (layout === "horizontal") {
    // Full-width rows with an empty row between them.
    for (let row = 1; row < rows; row += 2) {
      for (let column = 0; column < columns; column++) positions.push([column * step, row * step]);
    }
  } else if (layout === "x") {
    // Two diagonals corner to corner, spaced along the longer side so wide screens stay
    // a connected chain; where they cross they share one tile.
    const spanX = Math.max(0, width - tile);
    const spanY = Math.max(0, height - tile);
    const count = Math.max(2, Math.ceil(Math.max(width, height) / step));
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const [x, y] = [t * spanX, t * spanY];
      positions.push([x, y]);
      if (Math.abs(spanX - x - x) >= tile) positions.push([spanX - x, y]);
    }
  } else {
    // A band two tiles wide that zig-zags from edge to edge, one row at a time.
    const lastColumn = Math.max(1, columns - 2);
    for (let row = 0; row < rows; row++) {
      const phase = row % (2 * lastColumn);
      const start = phase <= lastColumn ? phase : 2 * lastColumn - phase;
      positions.push([start * step, row * step], [(start + 1) * step, row * step]);
    }
  }
  return positions;
};

/** Repeats one solved 2x2 pattern in a fixed arrangement, so it follows the picture above it. */
export default function BlockBackground({
  cells: cellsProp,
  layout: layoutProp,
  opacity = 0.2,
  color = RED,
}: Props) {
  const { width, height } = useWindowDimensions();
  const [random] = useState(() => ({
    cells: randomPatternCells(),
    layout: BACKGROUND_LAYOUTS[Math.floor(Math.random() * BACKGROUND_LAYOUTS.length)],
  }));
  const cells = cellsProp ?? random.cells;
  const layout = layoutProp ?? random.layout;
  const shapes = useMemo(() => {
    // Bigger tiles on bigger screens, so a tablet does not look sparse.
    const tile = Math.min(120, Math.max(TILE, Math.round(Math.min(width, height) / 6)));
    const cell = tile / 2;
    const result: (ReactElement | null)[] = [];
    tilePositions(layout, width, height, tile).forEach(([x, y], index) => {
      cells.forEach((type, cellIndex) => {
        result.push(
          cellShape(
            type,
            x + (cellIndex % 2) * cell,
            y + Math.floor(cellIndex / 2) * cell,
            `${index}-${cellIndex}`,
            color,
            cell,
          ),
        );
      });
    });
    return result;
  }, [cells, layout, width, height, color]);

  return (
    <Svg
      pointerEvents="none"
      width={width}
      height={height}
      style={[StyleSheet.absoluteFill, { opacity }]}
    >
      {shapes}
    </Svg>
  );
}

/** One solved pattern on a white card, scaled to any size. */
export function PatternTile({ cells, size }: { cells: CellType[]; size: number }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${TILE} ${TILE}`}>
      <Rect width={TILE} height={TILE} rx={8} fill="#FFFFFF" />
      {cells.map((type, index) =>
        cellShape(type, (index % 2) * CELL, Math.floor(index / 2) * CELL, `${index}`),
      )}
    </Svg>
  );
}
