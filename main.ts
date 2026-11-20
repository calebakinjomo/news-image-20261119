// The World in One Picture — Thursday 19 November 2026
// A deterministic newspaper front page, drawn entirely in code.
// Writes one 1024x1024 PNG to $MAKEFUN_OUTPUT_DIR/entry.png
// (or /output/entry.png when the variable is unset).
// Node 22+ standard library only. No clock, no randomness, no files
// read at run time — two runs produce byte-identical output.

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- font
// A hand-drawn 5x7 bitmap font. Each glyph is 7 rows of 5 cells,
// '#' = ink, '.' = empty. Uppercase, digits and common punctuation.

const GLYPHS: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  a: [".....", ".....", ".####", "....#", ".####", "#...#", ".####"],
  b: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "####."],
  c: [".....", ".....", ".####", "#....", "#....", "#....", ".####"],
  d: ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
  e: [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
  f: ["..##.", ".#..#", ".#...", "####.", ".#...", ".#...", ".#..."],
  g: [".....", ".....", ".####", "#...#", "#...#", ".####", "....#"],
  h: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "#...#"],
  i: [".....", "..#..", ".....", ".##..", "..#..", "..#..", ".###."],
  j: [".....", "...#.", ".....", "..##.", "...#.", "...#.", "...#.",],
  k: ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
  l: [".##..", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  m: [".....", ".....", "##.#.", "#.#.#", "#.#.#", "#.#.#", "#.#.#"],
  n: [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
  o: [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
  p: [".....", ".....", "####.", "#...#", "#...#", "####.", "#...."],
  q: [".....", ".....", ".####", "#...#", "#...#", ".####", "....#"],
  r: [".....", ".....", "#.##.", "##..#", "#....", "#....", "#...."],
  s: [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
  t: [".#...", ".#...", "####.", ".#...", ".#...", ".#...", "..##."],
  u: [".....", ".....", "#...#", "#...#", "#...#", "#..##", ".##.#"],
  v: [".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  w: [".....", ".....", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  y: [".....", ".....", "#...#", "#...#", "#...#", ".####", "....#"],
  z: [".....", ".....", "#####", "....#", "...#.", "..#..", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".....", ".##..", ".#..."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "'": ["..#..", "..#..", "..#..", ".....", ".....", ".....", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "%": ["#...#", "#..#.", "...#.", "..#..", ".#...", ".#..#", "#...#"],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  '"': [".#.#.", ".#.#.", ".#.#.", ".....", ".....", ".....", "....."],
  "=": [".....", ".....", "#####", ".....", "#####", ".....", "....."],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "*": [".....", ".#.#.", "..#..", "#####", "..#..", ".#.#.", "....."],
};

// ------------------------------------------------------------- palette
const PAPER: RGB = [247, 243, 232];
const INK: RGB = [22, 22, 22];
const RED: RGB = [172, 32, 32];
const BLUE: RGB = [38, 68, 108];
const GREY: RGB = [118, 112, 98];
const PANEL: RGB = [238, 231, 214];
const WHITE: RGB = [255, 255, 255];

type RGB = [number, number, number];

// ------------------------------------------------------------- canvas
class Canvas {
  readonly w = W;
  readonly h = H;
  private px = new Uint8Array(W * H * 3);

  constructor() {
    this.fill(PAPER);
  }

  fill(c: RGB): void {
    for (let i = 0; i < W * H; i++) {
      this.px[i * 3] = c[0];
      this.px[i * 3 + 1] = c[1];
      this.px[i * 3 + 2] = c[2];
    }
  }

  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.px[i] = c[0];
    this.px[i + 1] = c[1];
    this.px[i + 2] = c[2];
  }

  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    }
  }

  // Outline rectangle with a 1px border.
  frame(x: number, y: number, w: number, h: number, c: RGB): void {
    this.rect(x, y, w, 1, c);
    this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c);
    this.rect(x + w - 1, y, 1, h, c);
  }

  hline(x: number, y: number, w: number, c: RGB, thick = 1): void {
    this.rect(x, y, w, thick, c);
  }

  vline(x: number, y: number, h: number, c: RGB, thick = 1): void {
    this.rect(x, y, thick, h, c);
  }

  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.set(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) this.set(cx + x, cy + y, c);
      }
    }
  }

  ring(cx: number, cy: number, r: number, c: RGB): void {
    for (let a = 0; a < 360; a += 1) {
      const rad = (a * Math.PI) / 180;
      this.set(
        Math.round(cx + r * Math.cos(rad)),
        Math.round(cy + r * Math.sin(rad)),
        c,
      );
    }
  }

  // Filled triangle (p0 top, p1/p2 base corners), scanline fill.
  triangle(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    c: RGB,
  ): void {
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    const edge = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      y: number,
    ): number => {
      if (ay === by) return ax;
      return ax + ((bx - ax) * (y - ay)) / (by - ay);
    };
    for (let y = minY; y <= maxY; y++) {
      const xs = [
        edge(x0, y0, x1, y1, y),
        edge(x1, y1, x2, y2, y),
        edge(x2, y2, x0, y0, y),
      ].sort((a, b) => a - b);
      for (let x = Math.round(xs[0]); x <= Math.round(xs[2]); x++) {
        this.set(x, y, c);
      }
    }
  }
}

// -------------------------------------------------------------- text
function glyphWidth(scale: number, gap: number): number {
  return 5 * scale + gap;
}

function textWidth(text: string, scale: number, gap?: number): number {
  const g = gap === undefined ? scale : gap;
  if (text.length === 0) return 0;
  return text.length * glyphWidth(scale, g) - g;
}

function drawChar(
  cv: Canvas,
  ch: string,
  x: number,
  y: number,
  scale: number,
  c: RGB,
): void {
  const g = GLYPHS[ch] ?? GLYPHS["?"];
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === "#") {
        cv.rect(x + col * scale, y + r * scale, scale, scale, c);
      }
    }
  }
}

function drawText(
  cv: Canvas,
  text: string,
  x: number,
  y: number,
  scale: number,
  c: RGB,
  gap?: number,
): number {
  const g = gap === undefined ? scale : gap;
  let cx = x;
  for (const ch of text) {
    drawChar(cv, ch, cx, y, scale, c);
    cx += glyphWidth(scale, g);
  }
  return cx - x - g;
}

function drawTextCentred(
  cv: Canvas,
  text: string,
  cx: number,
  y: number,
  scale: number,
  c: RGB,
  gap?: number,
): void {
  const w = textWidth(text, scale, gap);
  drawText(cv, text, cx - Math.floor(w / 2), y, scale, c, gap);
}

// Greedy word wrap to a maximum pixel width. Returns the lines.
function wrapText(
  text: string,
  maxWidth: number,
  scale: number,
  gap?: number,
): string[] {
  const g = gap === undefined ? scale : gap;
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const trial = cur === "" ? word : cur + " " + word;
    if (textWidth(trial, scale, g) <= maxWidth || cur === "") {
      cur = trial;
    } else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- png
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePng(cv: Canvas): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    const src = (cv as unknown as { px: Uint8Array }).px;
    Buffer.from(src.buffer, y * W * 3, W * 3).copy(
      raw,
      y * (1 + W * 3) + 1,
    );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------- illustrations
// Every picture on the page is drawn with the canvas primitives above.

// Scales of justice, centred on (cx, top). About 300 wide, 250 tall.
function drawScales(cv: Canvas, cx: number, top: number): void {
  const beamY = top + 52;
  const baseY = top + 238;
  // Finial and pillar.
  cv.disc(cx, top + 14, 7, INK);
  cv.rect(cx - 5, top + 20, 10, baseY - top - 52, INK);
  // Crossbeam with slightly raised ends.
  cv.line(cx - 128, beamY - 14, cx + 128, beamY - 14, INK);
  cv.line(cx - 128, beamY - 13, cx + 128, beamY - 13, INK);
  cv.disc(cx - 128, beamY - 14, 4, INK);
  cv.disc(cx + 128, beamY - 14, 4, INK);
  // Chains and pans.
  for (const side of [-1, 1]) {
    const px = cx + side * 128;
    cv.line(px, beamY - 14, px - 34, beamY + 58, INK);
    cv.line(px, beamY - 14, px + 34, beamY + 58, INK);
    cv.line(px, beamY - 14, px, beamY + 58, INK);
    // Shallow bowl: two sloping sides and a chord across.
    cv.line(px - 40, beamY + 58, px, beamY + 90, INK);
    cv.line(px + 40, beamY + 58, px, beamY + 90, INK);
    cv.line(px - 28, beamY + 72, px + 28, beamY + 72, INK);
  }
  // Base plinth and steps.
  cv.rect(cx - 62, baseY - 26, 124, 12, INK);
  cv.rect(cx - 82, baseY - 14, 164, 12, INK);
  cv.rect(cx - 100, baseY - 2, 200, 8, RED);
}

// Three small flags on poles, for the trilateral summit story.
function drawFlags(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const cols: RGB[] = [RED, BLUE, [46, 110, 58]];
  const poleGap = Math.floor(w / 3);
  for (let i = 0; i < 3; i++) {
    const px = x + 14 + i * poleGap;
    cv.vline(px, y + 4, h - 6, INK, 2);
    const fy = y + 6;
    const fw = poleGap - 22;
    cv.rect(px + 2, fy, fw, 13, cols[i]);
    cv.rect(px + 2, fy, fw, 13, cols[i]);
    // A white star on each flag.
    cv.disc(px + 2 + Math.floor(fw / 2), fy + 6, 3, WHITE);
  }
  cv.hline(x, y + h - 2, w, GREY);
}

// Oil tanker on waves with a flame, for the Hormuz story.
function drawTanker(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const hullY = y + 18;
  // Flame above the funnel.
  const fx = x + Math.floor(w * 0.72);
  cv.triangle(fx - 8, hullY - 2, fx + 8, hullY - 2, fx, hullY - 16, RED);
  cv.triangle(fx - 4, hullY - 2, fx + 4, hullY - 2, fx, hullY - 10, [240, 170, 40]);
  // Hull and bridge.
  cv.rect(x + 8, hullY, w - 24, 12, INK);
  cv.rect(x + Math.floor(w * 0.62), hullY - 10, 26, 10, INK);
  cv.rect(x + Math.floor(w * 0.62) + 4, hullY - 16, 4, 6, INK);
  // Waves.
  for (let i = 0; i < 3; i++) {
    const wy = hullY + 16 + i * 6;
    for (let wx = x + 4; wx < x + w - 4; wx += 16) {
      cv.line(wx, wy, wx + 8, wy - 3, BLUE);
      cv.line(wx + 8, wy - 3, wx + 16, wy, BLUE);
    }
  }
}

// Rising chart with an arrow, for the IPO story.
function drawChart(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const ox = x + 12;
  const oy = y + h - 10;
  cv.vline(ox, y + 4, h - 14, INK, 2);
  cv.hline(ox, oy, w - 20, INK, 2);
  const pts: [number, number][] = [
    [0, 0.85], [0.22, 0.78], [0.38, 0.58], [0.55, 0.64],
    [0.72, 0.32], [0.88, 0.06],
  ];
  let px = ox + 4;
  let py = y + 6 + Math.floor(pts[0][1] * (h - 16));
  for (let i = 1; i < pts.length; i++) {
    const nx = ox + 4 + Math.floor(pts[i][0] * (w - 34));
    const ny = y + 6 + Math.floor(pts[i][1] * (h - 16));
    cv.line(px, py, nx, ny, RED);
    cv.line(px, py + 1, nx, ny + 1, RED);
    cv.disc(nx, ny, 3, RED);
    px = nx;
    py = ny;
  }
  // Arrowhead at the end of the rise.
  cv.line(px, py, px - 10, py + 1, RED);
  cv.line(px, py, px - 2, py + 10, RED);
}

// A flame, for the Bangladesh story. Centred, no base line.
function drawFlame(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const cx = x + Math.floor(w / 2);
  const base = y + h - 4;
  cv.triangle(cx - 26, base, cx + 26, base, cx, y + 6, RED);
  cv.triangle(cx - 14, base, cx + 14, base, cx, y + 18, [240, 170, 40]);
  cv.triangle(cx - 6, base, cx + 6, base, cx, y + 26, [250, 220, 90]);
}

// A capitol dome with columns, for the Speaker story.
// Drawn small (about 40 tall) to fit the story-box art strip.
function drawDome(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const cx = x + Math.floor(w / 2);
  const base = y + h - 6;
  // Dome: stacked horizontal slices of shrinking width.
  for (let r = 0; r <= 13; r += 1) {
    const yy = base - 16 - Math.floor(Math.sqrt(13 * 13 - r * r) * 0.8);
    cv.hline(cx - r, yy, r * 2, BLUE);
  }
  cv.vline(cx, base - 32, 6, INK, 2);
  cv.disc(cx, base - 33, 3, INK);
  // Drum and columns.
  cv.rect(cx - 15, base - 16, 30, 3, INK);
  for (let i = -1; i <= 1; i++) {
    cv.rect(cx + i * 11 - 2, base - 13, 4, 9, INK);
  }
  cv.rect(cx - 19, base - 4, 38, 4, INK);
}

// ------------------------------------------------------------ layout
function rule(cv: Canvas, y: number, thick: number, c: RGB): void {
  cv.hline(28, y, W - 56, c, thick);
}

// A secondary-story box: illustration on top, headline, then body text.
// Returns nothing; all text is wrapped to fit inside the box.
function storyBox(
  cv: Canvas,
  x: number,
  y: number,
  w: number,
  h: number,
  drawArt: (cv: Canvas, ax: number, ay: number, aw: number, ah: number) => void,
  headline: string[],
  body: string,
): void {
  cv.frame(x, y, w, h, INK);
  const pad = 12;
  const inner = w - pad * 2;
  drawArt(cv, x + pad, y + 8, inner, 40);
  let cy = y + 54;
  for (const line of headline) {
    drawText(cv, line, x + pad, cy, 3, INK, 2);
    cy += 25;
  }
  cy += 4;
  const lines = wrapText(body, inner, 2);
  for (const line of lines) {
    drawText(cv, line, x + pad, cy, 2, INK);
    cy += 18;
  }
}

// ------------------------------------------------------------ page
function main(): void {
  const cv = new Canvas();

  // ---- masthead
  rule(cv, 20, 3, INK);
  rule(cv, 26, 1, INK);
  drawTextCentred(cv, "THE WORLD IN ONE PICTURE", W / 2, 42, 6, INK);
  drawTextCentred(cv, "THURSDAY 19 NOVEMBER 2026", W / 2, 98, 3, RED);
  rule(cv, 128, 3, INK);

  // ---- lead story: text on the left, scales of justice on the right
  const leadTop = 140;
  const leadBottom = 512;
  drawText(cv, "THE HAGUE  -  WORLD COURT", 28, leadTop + 8, 2, RED);
  const headLines = ["WORLD COURT:", "MYANMAR GUILTY", "OF GENOCIDE"];
  let hy = leadTop + 34;
  for (const line of headLines) {
    drawText(cv, line, 28, hy, 5, INK);
    hy += 43;
  }
  const leadBody1 =
    "The International Court of Justice ruled on Thursday that Myanmar " +
    "committed genocide against the Rohingya in 2017 - the first time " +
    "the world court has found a state guilty of genocide.";
  const leadBody2 =
    "The Gambia brought the case in 2019. The court ordered Myanmar to " +
    "pay reparations and allow the safe return of refugees. About 10,000 " +
    "Rohingya were killed in 2017.";
  let by = leadTop + 172;
  for (const line of wrapText(leadBody1, 560, 2)) {
    drawText(cv, line, 28, by, 2, INK);
    by += 20;
  }
  by += 8;
  for (const line of wrapText(leadBody2, 560, 2)) {
    drawText(cv, line, 28, by, 2, INK);
    by += 20;
  }

  // Lead illustration box.
  const artX = 620;
  const artW = 996 - artX;
  cv.frame(artX, leadTop, artW, 330, INK);
  cv.rect(artX + 1, leadTop + 1, artW - 2, 330 - 2, PANEL);
  drawScales(cv, artX + Math.floor(artW / 2), leadTop + 22);
  drawTextCentred(
    cv, "Scales of justice at the", artX + Math.floor(artW / 2),
    leadTop + 288, 2, GREY,
  );
  drawTextCentred(
    cv, "International Court of Justice", artX + Math.floor(artW / 2),
    leadTop + 308, 2, GREY,
  );

  // ---- divider and section label
  rule(cv, 528, 3, INK);
  drawTextCentred(cv, "MORE FROM AROUND THE WORLD", W / 2, 542, 3, RED, 2);

  // ---- secondary stories: three across, then two across
  const row1Y = 572;
  const row1H = 216;
  const colW = 312;
  const gap = 16;
  storyBox(
    cv, 28, row1Y, colW, row1H, drawFlags,
    ["THREE POWERS, ONE", "PEACE DECLARATION"],
    "Trump, Xi and Putin met in Shenzhen and issued a four-point peace " +
      "declaration. It said nothing about Ukraine.",
  );
  storyBox(
    cv, 28 + colW + gap, row1Y, colW, row1H, drawTanker,
    ["TANKERS HIT IN", "STRAIT OF HORMUZ"],
    "Two oil tankers struck mines and exploded, Iran's navy said. 11 crew " +
      "injured, one missing; Brent crude hit $92.72.",
  );
  storyBox(
    cv, 28 + (colW + gap) * 2, row1Y, colW, row1H, drawChart,
    ["ANTHROPIC'S RECORD", "IPO DEBUT"],
    "The AI developer priced its IPO at $83 a share, the largest on " +
      "record; shares rose as much as 39% to $115.10.",
  );

  const row2Y = 796;
  const row2H = 200;
  const wideW = 476;
  storyBox(
    cv, 28, row2Y, wideW, row2H, drawFlame,
    ["BANGLADESH IN TURMOIL"],
    "Violence spread across 28 districts after Sheikh Hasina was sentenced " +
      "to death. Muhammad Yunus's ancestral home was set on fire.",
  );
  storyBox(
    cv, 28 + wideW + gap, row2Y, wideW, row2H, drawDome,
    ["JEFFRIES TO LEAD THE HOUSE"],
    "House Democrats nominated Hakeem Jeffries as Speaker by 251 votes to " +
      "11 - set to become the first African-American Speaker.",
  );

  // ---- footer
  drawTextCentred(
    cv, "All stories verified from multiple sources.",
    W / 2, 1006, 1, GREY,
  );

  const png = encodePng(cv);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "entry.png"), png);
}

main();

