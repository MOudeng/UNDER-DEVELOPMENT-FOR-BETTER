import { useState } from "react";
import { View } from "react-native";

import { randomPatternCells } from "../data/patternCells";
import { PatternTile } from "./BlockBackground";

const GAP = 10;

type Props = { width: number; maxSize?: number };

/** Three or four random patterns in a row, each a random size that still fits the width. */
export default function PatternRow({ width, maxSize = 96 }: Props) {
  const [plan] = useState(() =>
    Array.from({ length: Math.random() < 0.5 ? 3 : 4 }, () => ({
      cells: randomPatternCells(),
      scale: 0.7 + Math.random() * 0.3,
    })),
  );
  if (width <= 0) return null;

  const fit = Math.min(maxSize, (width - GAP * (plan.length - 1)) / plan.length);
  return (
    <View
      style={{
        width,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}
    >
      {plan.map((item, index) => (
        <PatternTile key={index} cells={item.cells} size={Math.floor(fit * item.scale)} />
      ))}
    </View>
  );
}
