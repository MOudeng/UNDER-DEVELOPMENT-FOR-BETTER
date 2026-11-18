// The 2x2 patterns of levels 5-8, cell by cell in the order TL, TR, BL, BR.
// tl/tr/bl/br is a half-red diagonal block, named for the corner holding the red
// triangle's right angle; R is a solid red block and W a solid white one.
export type CellType = "R" | "W" | "tl" | "tr" | "bl" | "br";

const parse = (text: string) => text.split(",") as CellType[];

export const PATTERN_CELLS: Record<string, CellType[]> = Object.fromEntries(
  Object.entries({
    "5a": "br,bl,tr,tl",
    "5b": "tl,tr,bl,br",
    "5c": "tl,tl,tl,tl",
    "5d": "br,br,br,br",
    "6a": "bl,br,tr,tl",
    "6b": "tr,tl,bl,br",
    "6c": "tl,br,tl,br",
    "6d": "br,tl,br,tl",
    "6e": "tr,bl,tr,br",
    "6f": "bl,br,tl,br",
    "6g": "br,tr,tl,br",
    "6h": "bl,br,tl,tl",
    "7a": "tr,tl,br,bl",
    "7b": "bl,br,tl,tr",
    "7c": "tr,br,tl,bl",
    "7d": "bl,tl,br,tr",
    "7e": "bl,bl,tl,tr",
    "7f": "bl,tl,bl,tl",
    "7g": "tr,bl,br,br",
    "7h": "br,tl,tr,tr",
    "8a": "bl,br,br,bl",
    "8b": "tr,tl,tl,tr",
    "8c": "br,tr,bl,tl",
    "8d": "tl,bl,tr,br",
    "8e": "bl,tr,bl,bl",
    "8f": "br,tr,br,tr",
    "8g": "tl,bl,tl,tr",
    "8h": "tl,bl,tl,tl",
  }).map(([name, cells]) => [name, parse(cells)]),
);

export const randomPatternCells = () => {
  const keys = Object.keys(PATTERN_CELLS);
  return PATTERN_CELLS[keys[Math.floor(Math.random() * keys.length)]];
};
