/**
 * Scroll-film configuration.
 *
 * One continuous film, rendered from 4K source in three frame sets:
 *   1) walk up to the real Aljada facade and through the noren,
 *   2) walk into the room past the zen garden (every object stays in place),
 *   3) sit down at a round oak table,
 *   4) dishes are served one by one (pancakes → Sabaku Matcha → sencha).
 * Each scene starts on the exact last frame of the previous one — no morphing between shots.
 *
 * The browser picks ONE set, so a phone never downloads desktop frames:
 *  - "portrait": vertical 720×1088, cut from the 4K source with a baked-in pan
 *                that follows the action (door → table → each dish as it lands)
 *  - "hd":       1920px wide (large / retina desktop)
 *  - "sd":       1280px wide (laptops, tablets in landscape, slow connections)
 */

export type FrameSetId = "portrait" | "hd" | "sd";

export interface FrameSet {
  id: FrameSetId;
  dir: string;
  width: number;
  height: number;
  /**
   * Safe zone: share of the frame (0–1) that must always stay visible.
   * If "cover" would crop more, the frame shrinks slightly and the gaps are
   * filled with a blurred copy of the same frame — the subject is never cut.
   */
  safeW: number;
  safeH: number;
}

// Set by scripts / frame extraction — must match the number of files in each set.
export const FRAME_COUNT = 317;

export const FRAME_SETS: Record<FrameSetId, FrameSet> = {
  portrait: { id: "portrait", dir: "/media/film2/m", width: 720, height: 1088, safeW: 0.7, safeH: 0.84 },
  hd: { id: "hd", dir: "/media/film2/hd", width: 1920, height: 1080, safeW: 0.72, safeH: 0.78 },
  sd: { id: "sd", dir: "/media/film2/sd", width: 1280, height: 720, safeW: 0.72, safeH: 0.78 },
};

/**
 * Focal track by film progress (0–1): where the subject sits in the frame.
 * Landscape crops centre on it; the portrait set already has the pan baked in.
 */
export const FOCAL_TRACK: Record<"landscape" | "portrait", Array<[progress: number, x: number, y: number]>> = {
  landscape: [
    [0, 0.5, 0.4], // SABAKU sign + door
    [0.25, 0.5, 0.5], // the noren fills the frame
    [0.4, 0.5, 0.52], // the room and the garden
    [0.62, 0.5, 0.6], // sitting down at the table
    [1, 0.5, 0.58], // the served table
  ],
  portrait: [
    [0, 0.5, 0.5],
    [1, 0.5, 0.5],
  ],
};

/** Captions over the film, by film progress. */
export const CAPTIONS = [
  { id: "enter", show: [-1, 0], hide: [0.05, 0.12], at: "bottom", h1: true, title: ["Step behind", "the noren"], text: "A Japanese café in Aljada, Sharjah. Slow coffee, green drinks and soufflé pancakes." },
  { id: "welcome", show: [0.17, 0.21], hide: [0.26, 0.3], at: "center", title: ["いらっしゃいませ"] },
  { id: "seat", show: [0.56, 0.6], hide: [0.66, 0.69], at: "bottom", title: ["Take a seat"], text: "Your table is ready." },
  // each dish is named the moment the server sets it down
  { id: "pancakes", show: [0.73, 0.76], hide: [0.81, 0.83], at: "bottom", title: ["Fluffy pancakes"], text: "Classic / Matcha / Crème Brûlée / Tiramisu — AED 50" },
  { id: "matcha", show: [0.85, 0.87], hide: [0.91, 0.93], at: "bottom", title: ["Sabaku Matcha"], text: "Iced camel milk matcha latte with desert flavours — AED 38" },
  { id: "served", show: [0.96, 0.99], hide: [2, 3], at: "bottom", title: ["Served"], text: "Fluffy Pancakes 50 · Sabaku Matcha 38 · Sencha 20 — AED" },
] as const;

export function frameUrl(set: FrameSet, i: number) {
  return `${set.dir}/f_${String(i).padStart(3, "0")}.webp`;
}

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/** Choose a frame set for this device (runs once, client-side). */
export function pickFrameSet(): { set: FrameSet; step: number } {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const conn = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  const slow = !!conn && (conn.saveData === true || /(^|-)2g|3g/.test(conn.effectiveType ?? ""));

  // On slow networks load every 2nd frame: half the bytes, scrubbing stays smooth.
  const step = slow ? 2 : 1;

  if (w / h < 0.8) return { set: FRAME_SETS.portrait, step };
  // 1920px frames only for large screens (matches the <picture>/preload media queries)
  if (slow || w < 1800) return { set: FRAME_SETS.sd, step };
  return { set: FRAME_SETS.hd, step };
}

export function focalAt(progress: number, orientation: "landscape" | "portrait"): [number, number] {
  const track = FOCAL_TRACK[orientation];
  if (progress <= track[0][0]) return [track[0][1], track[0][2]];
  for (let k = 1; k < track.length; k++) {
    const [p1, x1, y1] = track[k];
    const [p0, x0, y0] = track[k - 1];
    if (progress <= p1) {
      const t = (progress - p0) / (p1 - p0);
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    }
  }
  const last = track[track.length - 1];
  return [last[1], last[2]];
}
