#!/usr/bin/env node
// Draws the Petunjuk Penggunaan illustrations as SVG and renders them to PNG
// with a headless Chromium browser. The pattern shown is the real level asset.
// Run: BROWSER="path/to/msedge.exe" node scripts/generate-petunjuk-illustrations.mjs [outDir]
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const OUT_DIR = resolve(process.argv[2] ?? "src/assets/petunjuk");
const WIDTH = 1200;
const HEIGHT = 600;
const PATTERN = `data:image/png;base64,${readFileSync(
  "src/assets/TEST_RANDOM_OTAK_ATIK/Level 3/Lvl 3a.png",
).toString("base64")}`;

const RED = { top: "#F01A1A", front: "#D01616", side: "#A91212" };
const WHITE = { top: "#FBF8F2", front: "#EFEAE0", side: "#D2CBBD" };
const EDGE = "#6B5B52";
const SKIN = "#DDAA84";
const SKIN_SHADE = "#C8926C";
const DRESS = "#7A3B3B";
const DRESS_SHADE = "#5F2C2D";
const HAIR = "#2E2420";
const FONT = "Segoe UI, Arial, sans-serif";

const poly = (points, fill, extra = "") =>
  `<polygon points="${points.map(([x, y]) => `${x},${y}`).join(" ")}" fill="${fill}" ${extra}/>`;

// Solid cube: tall front face and a top face receding up and to the right.
// topFace "white-br"/"white-bl" is a half-diagonal face, red in that corner.
// frontFace "half" is a half-diagonal face, as on real Block Design cubes.
const cube = (x, y, s, topFace, frontFace, sideColor) => {
  const dx = s * 0.24;
  const dy = -s * 0.5;
  const h = s * 0.86;
  const line = `stroke="${EDGE}" stroke-width="1.5" stroke-linejoin="round"`;
  const backLeft = [x + dx, y + dy];
  const backRight = [x + s + dx, y + dy];
  const frontLeft = [x, y];
  const frontRight = [x + s, y];
  const bottomLeft = [x, y + h];
  const bottomRight = [x + s, y + h];
  let top = poly([backLeft, backRight, frontRight, frontLeft], topFace === "red" ? RED.top : WHITE.top, line);
  if (topFace === "white-br") top += poly([backRight, frontRight, frontLeft], RED.top, line);
  if (topFace === "white-bl") top += poly([backLeft, frontRight, frontLeft], RED.top, line);
  let front = poly([frontLeft, frontRight, bottomRight, bottomLeft], frontFace === RED ? RED.front : WHITE.front, line);
  if (frontFace === "half") front += poly([frontRight, bottomRight, bottomLeft], RED.front, line);
  return (
    poly([frontRight, backRight, [x + s + dx, y + dy + h], bottomRight], sideColor.side, line) +
    front +
    top +
    `<path d="M${x + 2} ${y + 2} H${x + s - 2}" stroke="#FFFFFF" stroke-width="2" opacity="0.45"/>`
  );
};

// The four blocks of level 3 pattern a: white/red diagonals at the back, red in front.
const BLOCK = 70;
const blocks = (x, y, { lastBlock = true } = {}) => {
  const s = BLOCK;
  const backX = x + s * 0.24;
  const backY = y - s * 0.5;
  return (
    `<ellipse cx="${x + s + 18}" cy="${y + s * 0.86 + 2}" rx="${s * 1.3}" ry="11" fill="#4A2C14" opacity="0.4" filter="url(#soft)"/>` +
    cube(backX, backY, s, "white-br", WHITE, RED) +
    cube(backX + s, backY, s, "white-bl", RED, WHITE) +
    cube(x, y, s, "red", WHITE, RED) +
    (lastBlock ? cube(x + s, y, s, "red", "half", WHITE) : "")
  );
};

const room = `
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#wall)"/>
  <rect y="345" width="${WIDTH}" height="255" fill="#E2D1BA"/>
  <rect y="341" width="${WIDTH}" height="6" fill="#D0BBA0"/>
  <rect x="534" y="40" width="182" height="164" rx="3" fill="#FBF8F2"/>
  <rect x="546" y="52" width="76" height="140" fill="url(#sky)"/>
  <rect x="628" y="52" width="76" height="140" fill="url(#sky)"/>
  <rect x="524" y="204" width="202" height="10" rx="3" fill="#EFE6D8"/>
  <path d="M506 30 H552 C556 90 548 170 524 232 H506 Z" fill="#E7D3BC"/>
  <path d="M744 30 H698 C694 90 702 170 726 232 H744 Z" fill="#E7D3BC"/>
  <path d="M520 32 C522 100 518 170 512 228 M536 32 C538 96 532 170 524 226 M730 32 C728 100 732 170 738 228 M714 32 C712 96 718 170 726 226" fill="none" stroke="#D3BBA1" stroke-width="3"/>
  <rect x="500" y="24" width="250" height="8" rx="4" fill="#9C7A5A"/>
`;

const table = `
  <polygon points="28,420 1172,420 1200,572 0,572" fill="url(#wood)"/>
  <path d="M28 420 H1172" stroke="#DDB486" stroke-width="3"/>
  <path d="M110 450 C300 444 420 456 470 450 M820 452 C940 446 1040 456 1130 450 M50 500 C200 492 340 506 462 498 M790 500 C900 492 1050 506 1170 498 M30 548 C170 540 330 554 470 546 M770 548 C900 540 1040 554 1186 546" fill="none" stroke="#A9794A" stroke-width="2.5" opacity="0.45"/>
  <rect y="572" width="${WIDTH}" height="28" fill="#8F6439"/>
  <rect y="572" width="${WIDTH}" height="3" fill="#B98A58"/>
`;

// Tablet on its folding cover, turned toward the child, with the real pattern on screen.
const tablet = (verified) => `
  <ellipse cx="1012" cy="486" rx="150" ry="14" fill="#4A2C14" opacity="0.4" filter="url(#soft)"/>
  <polygon points="1128,262 1166,466 1110,478" fill="#1F2125"/>
  <polygon points="872,466 1140,480 1176,466 926,450" fill="#2B2D32"/>
  <path d="M880 466 L1140 480" stroke="#3E4148" stroke-width="3"/>
  <foreignObject x="820" y="190" width="360" height="310">
    <div style="width:360px;height:310px;perspective:800px;display:flex;align-items:center;justify-content:center">
      <div style="width:286px;height:206px;box-sizing:border-box;padding:11px;border-radius:18px;background:linear-gradient(135deg,#3A3D43,#1F2125);transform:rotateY(-24deg) rotateX(7deg)">
        <div style="width:100%;height:100%;border-radius:7px;background:#FFFFFF;display:flex;align-items:center;justify-content:center">
          <img src="${PATTERN}" style="width:166px;height:166px;display:block;outline:1.5px solid #C9C2BA" alt=""/>
        </div>
      </div>
    </div>
  </foreignObject>
  ${
    verified
      ? `<circle cx="1140" cy="232" r="32" fill="#1E8A4C" filter="url(#lift)"/><path d="M1125 232 L1136 244 L1156 220" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`
      : ""
  }
`;
const sleeve = (d, width) =>
  `<path d="${d}" fill="none" stroke="${DRESS}" stroke-width="${width}" stroke-linecap="round"/>`;

// Plain adult proportions and small eyes: an ordinary mother, not a mascot.
// Bodies go behind the table, arms and hands in front of it.
const parentBody = ({ happy }) => `
  <ellipse cx="350" cy="310" rx="150" ry="175" fill="#7A5A3E" opacity="0.06" filter="url(#soft)"/>
  <path d="M212 440 C214 352 250 312 300 298 L396 298 C446 312 478 352 484 440 Z" fill="${DRESS}"/>
  <path d="M290 190 C284 120 320 92 354 92 C392 92 424 120 418 190 C424 236 428 272 420 304 C400 284 394 252 392 232 L316 232 C314 252 308 284 288 304 C280 272 286 236 290 190 Z" fill="${HAIR}"/>
  <rect x="332" y="236" width="44" height="68" rx="16" fill="${SKIN_SHADE}"/>
  <path d="M316 298 C330 318 376 318 390 298" fill="none" stroke="${DRESS_SHADE}" stroke-width="5" stroke-linecap="round"/>
  <path d="M296 176 C296 130 324 112 354 112 C392 112 412 138 410 180 C408 226 384 258 354 258 C322 258 296 224 296 176 Z" fill="${SKIN}" stroke="#C7A98C" stroke-width="3"/>
  <path d="M296 170 C294 124 322 102 354 102 C392 102 416 126 410 170 C398 142 376 130 350 132 C326 134 308 148 296 170 Z" fill="${HAIR}"/>
  <path d="M336 160 q10 -5 20 -1 M380 158 q9 -4 17 1" fill="none" stroke="#5A4034" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M337 174 q10 -7 20 0 M380 172 q9 -6 18 0" fill="none" stroke="#2B1F1B" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="348" cy="178" rx="4.5" ry="5.5" fill="#2B1F1B"/><circle cx="350" cy="176" r="1.4" fill="#FFFFFF"/>
  <ellipse cx="390" cy="176" rx="4.5" ry="5.5" fill="#2B1F1B"/><circle cx="392" cy="174" r="1.4" fill="#FFFFFF"/>
  <path d="M374 184 q6 13 -3 18" fill="none" stroke="${SKIN_SHADE}" stroke-width="3" stroke-linecap="round"/>
  ${
    happy
      ? `<path d="M349 216 q21 20 42 -2 q-21 7 -42 2 Z" fill="#8A3F35"/>`
      : `<path d="M353 220 q15 9 29 -1" fill="none" stroke="#8A4A3C" stroke-width="3.5" stroke-linecap="round"/>`
  }
`;

const restingHand = (x, y, direction) =>
  `<path d="M${x} ${y - 10} C${x + direction * 20} ${y - 18} ${x + direction * 46} ${y - 10} ${x + direction * 48} ${y + 2} C${x + direction * 46} ${y + 14} ${x + direction * 16} ${y + 16} ${x} ${y + 10} Z" fill="${SKIN}"/>
   <path d="M${x + direction * 22} ${y - 2} l${direction * 20} 3 M${x + direction * 20} ${y + 5} l${direction * 20} 2" stroke="${SKIN_SHADE}" stroke-width="2" stroke-linecap="round"/>`;

const parentArms = ({ thumbUp }) => `
  ${sleeve("M254 372 C244 406 256 442 292 458", 38)}
  <path d="M272 376 C268 398 274 416 286 430" fill="none" stroke="${DRESS_SHADE}" stroke-width="3" stroke-linecap="round"/>
  ${restingHand(296, 462, 1)}
  ${
    thumbUp
      ? `${sleeve("M446 372 C468 392 476 408 466 428", 36)}
         <path d="M432 380 C436 400 438 414 444 428" fill="none" stroke="${DRESS_SHADE}" stroke-width="3" stroke-linecap="round"/>
         <rect x="446" y="340" width="17" height="48" rx="8.5" fill="${SKIN}"/>
         <rect x="444" y="374" width="46" height="42" rx="14" fill="${SKIN}"/>
         <path d="M456 386 H486 M456 396 H486 M456 406 H484" stroke="${SKIN_SHADE}" stroke-width="2.5" stroke-linecap="round"/>`
      : `${sleeve("M442 372 C452 412 444 446 424 460", 36)}
         <path d="M424 376 C428 398 422 416 410 430" fill="none" stroke="${DRESS_SHADE}" stroke-width="3" stroke-linecap="round"/>
         ${restingHand(428, 466, -1)}`
  }
`;

const childBody = ({ happy }) => `
  <ellipse cx="746" cy="340" rx="100" ry="110" fill="#7A5A3E" opacity="0.06" filter="url(#soft)"/>
  <path d="M664 440 C664 366 696 330 744 326 C794 330 826 366 830 440 Z" fill="#4C7A68"/>
  <rect x="724" y="302" width="40" height="42" rx="14" fill="${SKIN_SHADE}"/>
  <path d="M716 332 C728 352 760 352 772 332" fill="none" stroke="#3B6353" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="742" cy="258" rx="53" ry="55" fill="${SKIN}"/>
  <circle cx="795" cy="266" r="11" fill="${SKIN}"/>
  <path d="M795 260 q6 5 1 12" fill="none" stroke="${SKIN_SHADE}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M690 260 C674 200 716 174 750 178 C778 170 814 198 798 258 C796 240 786 228 772 222 L762 238 L750 222 L736 240 L724 224 C708 230 696 244 690 260 Z" fill="#26211F"/>
  <path d="M714 198 C730 186 758 184 776 194" fill="none" stroke="#453B37" stroke-width="4" stroke-linecap="round"/>
  <path d="M700 246 q10 -5 20 0 M744 246 q10 -5 20 0" fill="none" stroke="#26211F" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M730 270 q-5 7 2 10" fill="none" stroke="${SKIN_SHADE}" stroke-width="3" stroke-linecap="round"/>
  ${
    happy
      ? `<path d="M703 264 q7 -8 15 0 M745 264 q7 -8 15 0" fill="none" stroke="#2B1F1B" stroke-width="4" stroke-linecap="round"/><path d="M714 286 q17 20 34 0 Z" fill="#8A3F35"/>`
      : `<ellipse cx="710" cy="262" rx="4.5" ry="5.5" fill="#2B1F1B"/><circle cx="712" cy="260" r="1.4" fill="#FFFFFF"/><ellipse cx="752" cy="262" rx="4.5" ry="5.5" fill="#2B1F1B"/><circle cx="754" cy="260" r="1.4" fill="#FFFFFF"/><path d="M718 292 q12 7 23 -1" fill="none" stroke="#8A4A3C" stroke-width="3.5" stroke-linecap="round"/>`
  }
`;

const childArms = ({ hand }) => `
  <path d="M684 390 C674 420 ${hand.x + 6} ${hand.y - 40} ${hand.x} ${hand.y - 8}" fill="none" stroke="${SKIN}" stroke-width="24" stroke-linecap="round"/>
  <path d="M694 378 C686 392 680 404 678 416" fill="none" stroke="#4C7A68" stroke-width="30" stroke-linecap="butt"/>
  <path d="M664 414 L692 419" stroke="#3B6353" stroke-width="3" stroke-linecap="round"/>
  <circle cx="${hand.x}" cy="${hand.y}" r="16" fill="${SKIN}"/>
  <path d="M${hand.x - 7} ${hand.y + 6} v7 M${hand.x} ${hand.y + 8} v7 M${hand.x + 7} ${hand.y + 6} v7" stroke="${SKIN_SHADE}" stroke-width="2" stroke-linecap="round"/>
  <path d="M808 390 C822 424 820 448 804 462" fill="none" stroke="${SKIN}" stroke-width="24" stroke-linecap="round"/>
  <path d="M800 378 C808 392 814 404 816 416" fill="none" stroke="#4C7A68" stroke-width="30" stroke-linecap="butt"/>
  <path d="M802 419 L830 414" stroke="#3B6353" stroke-width="3" stroke-linecap="round"/>
  <circle cx="798" cy="468" r="16" fill="${SKIN}"/>
`;

const scene = (content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <clipPath id="c"><rect width="${WIDTH}" height="${HEIGHT}" rx="28"/></clipPath>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7EFE3"/><stop offset="1" stop-color="#EADCC9"/></linearGradient>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE3EA"/><stop offset="1" stop-color="#F1F7F7"/></linearGradient>
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFA070"/><stop offset="1" stop-color="#B98857"/></linearGradient>
      <linearGradient id="cover" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A4E55"/><stop offset="1" stop-color="#34363B"/></linearGradient>
      <linearGradient id="backdrop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBEAE4"/><stop offset="1" stop-color="#F4D9D1"/></linearGradient>
      <filter id="soft" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
      <filter id="lift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#4A2C14" flood-opacity="0.22"/></filter>
    </defs>
    <g clip-path="url(#c)">${content}</g></svg>`;

const label = (x, y, text, size, weight, fill, anchor = "start") =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${text}</text>`;

// Screen mock-ups repeat the labels the app really shows.
const screen = (content) =>
  scene(`
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#backdrop)"/>
    <rect x="150" y="30" width="900" height="540" rx="34" fill="#2F3136" filter="url(#lift)"/>
    <circle cx="600" cy="41" r="4" fill="#15161A"/>
    <rect x="172" y="52" width="856" height="496" rx="14" fill="#F6F6F6"/>
    ${content}`);

const ICONS = {
  gamepad: `<rect x="-22" y="-12" width="44" height="24" rx="12" fill="#FFFFFF"/><path d="M-13 0 H-5 M-9 -4 V4" stroke="#C2410C" stroke-width="3" stroke-linecap="round"/><circle cx="10" cy="0" r="3.5" fill="#C2410C"/>`,
  person: `<circle cy="-9" r="9" fill="#FFFFFF"/><path d="M-17 18 C-17 2 17 2 17 18 Z" fill="#FFFFFF"/>`,
  check: `<rect x="-15" y="-19" width="30" height="38" rx="5" fill="#FFFFFF"/><path d="M-7 0 L-2 6 L8 -7" fill="none" stroke="#D9392B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  repeat: `<path d="M-14 6 A15 15 0 0 1 12 -9 M14 -6 A15 15 0 0 1 -12 9" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/><path d="M12 -18 V-8 H2 M-12 18 V8 H-2" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
};

const optionCard = (y, title, description, accent, icon) => `
  <rect x="204" y="${y}" width="792" height="150" rx="18" fill="#FFFFFF" stroke="#E5D8D4" stroke-width="2"/>
  <rect x="228" y="${y + 37}" width="76" height="76" rx="18" fill="${accent}"/>
  <g transform="translate(266 ${y + 75})">${ICONS[icon]}</g>
  ${label(326, y + 68, title, 40, 700, "#4D3532")}
  ${label(326, y + 112, description, 30, 400, "#6B5A57")}
`;

const step1 = screen(`
  ${label(204, 118, "Pilih cara bermain", 42, 800, "#D9392B")}
  ${optionCard(146, "Main sebagai Tamu", "Hasil tidak disimpan", "#C2410C", "gamepad")}
  ${optionCard(316, "Akun", "Hasil disimpan ke profil", "#2563EB", "person")}
`);

const step2 = screen(`
  ${label(204, 118, "PILIH MODE PERMAINAN", 36, 700, "#6B5A57")}
  ${optionCard(146, "TEST", "8 level", "#D9392B", "check")}
  ${optionCard(316, "PRACTICE/SIMULASI", "Latihan tanpa batas", "#2563EB", "repeat")}
`);

const step5Rows = [
  ["Pola 1", "00:18"],
  ["Pola 2", "00:24"],
];
const step5 = screen(`
  ${label(204, 118, "Hasil Permainan", 46, 800, "#5D3F3C")}
  ${label(996, 116, "Contoh", 30, 600, "#6B5A57", "end")}
  <rect x="204" y="146" width="792" height="150" rx="18" fill="#FFFFFF" stroke="#E5D8D4" stroke-width="2"/>
  ${label(232, 234, "Total waktu", 40, 600, "#4D3532")}
  ${label(968, 244, "03:15", 72, 800, "#D9392B", "end")}
  <rect x="204" y="316" width="792" height="196" rx="18" fill="#FFFFFF" stroke="#E5D8D4" stroke-width="2"/>
  ${step5Rows
    .map(
      ([name, time], index) =>
        label(232, 394 + index * 72, name, 38, 500, "#6B5A57") +
        label(968, 394 + index * 72, time, 40, 700, "#4D3532", "end"),
    )
    .join("")}
`);

const LOOSE = { x: 668, y: 500 };
const step3 = scene(`
  ${room}
  ${parentBody({ happy: false })}
  ${childBody({ happy: false })}
  ${table}
  ${tablet(false)}
  ${blocks(486, 500, { lastBlock: false })}
  <ellipse cx="${LOOSE.x + 44}" cy="${LOOSE.y + 62}" rx="60" ry="9" fill="#4A2C14" opacity="0.4" filter="url(#soft)"/>
  ${cube(LOOSE.x, LOOSE.y, BLOCK, "red", "half", WHITE)}
  ${parentArms({ thumbUp: false })}
  ${childArms({ hand: { x: LOOSE.x + 44, y: LOOSE.y - 20 } })}
`);

const step4 = scene(`
  ${room}
  ${parentBody({ happy: true })}
  ${childBody({ happy: true })}
  ${table}
  ${tablet(true)}
  ${blocks(486, 500)}
  ${parentArms({ thumbUp: true })}
  ${childArms({ hand: { x: 690, y: 480 } })}
`);

const browser = process.env.BROWSER;
if (!browser) throw new Error("Set BROWSER to a Chromium-based browser executable.");
mkdirSync(OUT_DIR, { recursive: true });
const workDir = mkdtempSync(join(tmpdir(), "petunjuk-"));
for (const [name, svg] of Object.entries({ step1, step2, step3, step4, step5 })) {
  const page = join(workDir, `${name}.html`);
  writeFileSync(page, `<!DOCTYPE html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
  execFileSync(browser, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--hide-scrollbars",
    "--default-background-color=00000000",
    `--user-data-dir=${join(workDir, "profile")}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    `--screenshot=${join(OUT_DIR, `${name}.png`)}`,
    `file:///${page.replace(/\\/g, "/")}`,
  ], { stdio: "ignore", timeout: 60_000 });
}
rmSync(workDir, { recursive: true, force: true });
console.log(`OK: illustrations written to ${OUT_DIR}`);
