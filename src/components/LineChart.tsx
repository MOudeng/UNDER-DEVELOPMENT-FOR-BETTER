import { useState } from "react";
import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import { niceTicks } from "../utils/progressStats";

export type ChartSeries = {
  label: string;
  color: string;
  dashed?: boolean;
  values: number[];
};

type Props = {
  series: ChartSeries[];
  xLabels: string[];
  xTitle: string;
  unit: string;
};

const HEIGHT = 230;
const PADDING = { top: 12, right: 16, bottom: 44, left: 44 };
const AXIS_COLOR = "#6b5a57";

export default function LineChart({ series, xLabels, xTitle, unit }: Props) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const count = xLabels.length;
  if (count === 0 || series.length === 0) return null;

  const plotWidth = Math.max(1, width - PADDING.left - PADDING.right);
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const ticks = niceTicks(Math.max(...series.flatMap((line) => line.values)));
  const topTick = ticks[ticks.length - 1];
  const xFor = (index: number) =>
    PADDING.left +
    (count === 1 ? plotWidth / 2 : (index * plotWidth) / (count - 1));
  const yFor = (value: number) =>
    PADDING.top + plotHeight * (1 - value / topTick);
  const labelEvery = Math.ceil(count / Math.max(1, Math.floor(plotWidth / 36)));
  const activeIndex = selected !== null && selected < count ? selected : null;

  // The whole plot is the touch target, so dense points stay easy to pick.
  const selectNearest = (event: GestureResponderEvent) => {
    const position = (event.nativeEvent.locationX - PADDING.left) / plotWidth;
    const index = Math.round(position * (count - 1));
    setSelected(Math.min(count - 1, Math.max(0, index)));
  };

  return (
    <View>
      {series.length > 1 ? (
        <View style={styles.legend}>
          {series.map((line) => (
            <View key={line.label} style={styles.legendItem}>
              <Svg width={26} height={10}>
                <Line
                  x1={0}
                  y1={5}
                  x2={26}
                  y2={5}
                  stroke={line.color}
                  strokeWidth={3}
                  strokeDasharray={line.dashed ? "6 4" : undefined}
                />
              </Svg>
              <Text style={styles.legendText}>{line.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.tooltip}>
        {activeIndex === null
          ? "Ketuk grafik untuk melihat angkanya."
          : `${xTitle} ${xLabels[activeIndex]}: ${series
              .map(
                (line) =>
                  `${series.length > 1 ? `${line.label} ` : ""}${Math.round(line.values[activeIndex])} ${unit}`,
              )
              .join(" • ")}`}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={series
          .map(
            (line) =>
              `${line.label}: ${line.values
                .map(
                  (value, index) =>
                    `${xTitle} ${xLabels[index]} ${Math.round(value)} ${unit}`,
                )
                .join(", ")}`,
          )
          .join(". ")}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onPress={selectNearest}
        style={{ height: HEIGHT }}
      >
        {width > 0 ? (
          <View pointerEvents="none">
            <Svg width={width} height={HEIGHT}>
              {ticks.map((tick) => (
                <Line
                  key={`grid-${tick}`}
                  x1={PADDING.left}
                  x2={width - PADDING.right}
                  y1={yFor(tick)}
                  y2={yFor(tick)}
                  stroke="#f0e1de"
                  strokeWidth={1}
                />
              ))}
              {ticks.map((tick) => (
                <SvgText
                  key={`tick-${tick}`}
                  x={PADDING.left - 6}
                  y={yFor(tick) + 4}
                  fontSize={11}
                  fill={AXIS_COLOR}
                  textAnchor="end"
                >
                  {tick}
                </SvgText>
              ))}
              {xLabels.map((label, index) =>
                index % labelEvery === 0 ? (
                  <SvgText
                    key={`x-${label}`}
                    x={xFor(index)}
                    y={HEIGHT - PADDING.bottom + 18}
                    fontSize={11}
                    fill={AXIS_COLOR}
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                ) : null,
              )}
              <SvgText
                x={PADDING.left + plotWidth / 2}
                y={HEIGHT - 6}
                fontSize={12}
                fontWeight="bold"
                fill={AXIS_COLOR}
                textAnchor="middle"
              >
                {xTitle}
              </SvgText>

              {activeIndex !== null ? (
                <Line
                  x1={xFor(activeIndex)}
                  x2={xFor(activeIndex)}
                  y1={PADDING.top}
                  y2={PADDING.top + plotHeight}
                  stroke="#c9b8b4"
                  strokeWidth={1}
                />
              ) : null}

              {series.map((line) => (
                <Polyline
                  key={`line-${line.label}`}
                  points={line.values
                    .map((value, index) => `${xFor(index)},${yFor(value)}`)
                    .join(" ")}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={2.5}
                  strokeDasharray={line.dashed ? "6 4" : undefined}
                />
              ))}
              {series.flatMap((line) =>
                line.values.map((value, index) => (
                  <Circle
                    key={`point-${line.label}-${index}`}
                    cx={xFor(index)}
                    cy={yFor(value)}
                    r={index === activeIndex ? 6 : count > 30 ? 2 : 4}
                    fill={line.color}
                  />
                )),
              )}
            </Svg>
          </View>
        ) : null}
      </Pressable>
      <Text style={styles.unit}>Waktu dalam {unit}. Semakin rendah, semakin singkat.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: { color: "#5d3f3c", fontSize: 12, fontWeight: "700" },
  tooltip: { color: "#5d3f3c", fontSize: 13, fontWeight: "700", minHeight: 36 },
  unit: { color: "#6b5a57", fontSize: 11, marginTop: 2 },
});
