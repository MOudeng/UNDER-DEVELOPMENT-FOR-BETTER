import { useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";

const STEP = 44;
const SIZE = 24;
const COLOR = "#f45023";

const corners = (x: number, y: number, orientation: number) => {
  const [r, b] = [x + SIZE, y + SIZE];
  return [
    `${x},${y} ${r},${y} ${x},${b}`,
    `${x},${y} ${r},${y} ${r},${b}`,
    `${x},${y} ${x},${b} ${r},${b}`,
    `${r},${y} ${r},${b} ${x},${b}`,
  ][orientation];
};

/**
 * Small, faint triangles over a card. Quiet on purpose: it must not pull the
 * player's eyes away from the pattern they are copying.
 */
export default function TriangleBackground({ opacity = 0.07 }: { opacity?: number }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  // One orientation per slot, drawn once so re-renders never reshuffle them.
  const [orientations] = useState(() =>
    Array.from({ length: 400 }, () => Math.floor(Math.random() * 4)),
  );

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) =>
    setSize({ width: nativeEvent.layout.width, height: nativeEvent.layout.height });

  const columns = Math.ceil(size.width / STEP);
  const rows = Math.ceil(size.height / STEP);
  const triangles = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = (row * columns + column) % orientations.length;
      // Every other row is shifted by half a step so it does not read as a grid.
      const x = column * STEP + (row % 2) * (STEP / 2);
      triangles.push(
        <Polygon
          key={`${row}-${column}`}
          points={corners(x, row * STEP, orientations[index])}
          fill={COLOR}
        />,
      );
    }
  }

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, { opacity }]}
    >
      {size.width > 0 ? (
        <Svg width={size.width} height={size.height}>
          {triangles}
        </Svg>
      ) : null}
    </View>
  );
}
