/**
 * Priority frame loader for the scroll film — memory-safe version.
 *
 * Two layers:
 *  - compressed files (Blob, ~50 KB each) are downloaded for the whole film
 *    and kept: the full mobile set is ~16 MB;
 *  - decoded bitmaps (~3 MB each!) are kept ONLY for a small window around the
 *    current scroll position. Everything else is closed right away.
 *
 * The previous version decoded and kept all 317 frames (~1 GB of bitmaps),
 * which made iOS kill the tab ("A problem repeatedly occurred").
 *
 * Download order: first 12 frames → forward-biased window around the visitor →
 * coarse-to-fine fill (every 8th, 4th, 2nd…), max N requests in flight.
 */

export type Frame = ImageBitmap | HTMLImageElement;

const isMobile = () =>
  typeof navigator !== "undefined" &&
  (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export class FrameLoader {
  private blobs: (Blob | null)[];
  private state: Uint8Array; // download: 0 idle, 1 loading, 2 done, 3 failed
  private decoded = new Map<number, Frame>();
  private decoding = new Set<number>();
  private inFlight = 0;
  private target = 0;
  private destroyed = false;
  private coarseOrder: number[];
  /** Max decoded frames kept in memory at once. */
  private budget: number;
  private ahead: number;
  private behind: number;
  loaded = 0;

  constructor(
    private urls: string[],
    private onFrame: (index: number) => void,
    private maxConcurrent = 6,
  ) {
    const mobile = isMobile();
    this.budget = mobile ? 22 : 64;
    this.ahead = mobile ? 12 : 36;
    this.behind = mobile ? 6 : 16;
    if (mobile) this.maxConcurrent = Math.min(maxConcurrent, 4);

    this.blobs = new Array(urls.length).fill(null);
    this.state = new Uint8Array(urls.length);
    const seen = new Set<number>();
    this.coarseOrder = [];
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < urls.length; i += step) {
        if (!seen.has(i)) {
          seen.add(i);
          this.coarseOrder.push(i);
        }
      }
    }
  }

  get total() {
    return this.urls.length;
  }

  focus(index: number) {
    const t = Math.max(0, Math.min(this.urls.length - 1, index));
    if (t === this.target) return;
    this.target = t;
    this.pump();
    this.decodeWindow();
  }

  start() {
    this.pump();
  }

  destroy() {
    this.destroyed = true;
    for (const f of this.decoded.values()) if ("close" in f) f.close();
    this.decoded.clear();
    this.blobs.fill(null);
  }

  /** Nearest decoded frame — used while the exact one is still decoding. */
  nearest(index: number): Frame | null {
    const exact = this.decoded.get(index);
    if (exact) return exact;
    let best: Frame | null = null;
    let bestD = Infinity;
    for (const [i, f] of this.decoded) {
      const d = Math.abs(i - index);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    return best;
  }

  // ---------- downloading (compressed) ----------

  private next(): number {
    const n = this.urls.length;
    for (let i = 0; i < Math.min(12, n); i++) if (this.state[i] === 0) return i;
    for (let d = 0; d < 24; d++) {
      const a = this.target + d;
      if (a < n && this.state[a] === 0) return a;
      if (d < 8) {
        const b = this.target - d;
        if (b >= 0 && this.state[b] === 0) return b;
      }
    }
    for (const i of this.coarseOrder) if (this.state[i] === 0) return i;
    return -1;
  }

  private pump() {
    if (this.destroyed) return;
    while (this.inFlight < this.maxConcurrent) {
      const i = this.next();
      if (i < 0) return;
      this.state[i] = 1;
      this.inFlight++;
      this.download(i).finally(() => {
        this.inFlight--;
        this.pump();
      });
    }
  }

  private async download(i: number) {
    try {
      const res = await fetch(this.urls[i], { priority: i < 12 ? "high" : "low" } as RequestInit);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      if (this.destroyed) return;
      this.blobs[i] = blob;
      this.state[i] = 2;
      this.loaded++;
      this.onFrame(i);
      if (this.inWindow(i) || this.decoded.size === 0) this.decode(i);
    } catch {
      this.state[i] = 3;
      this.loaded++;
      this.onFrame(i);
    }
  }

  // ---------- decoding (bitmaps, bounded) ----------

  private inWindow(i: number) {
    return i >= this.target - this.behind && i <= this.target + this.ahead;
  }

  private decodeWindow() {
    // drop frames far from the visitor first
    this.evict();
    // nearest-first: exact frame, then ahead/behind alternating
    for (let d = 0; d <= this.ahead; d++) {
      const a = this.target + d;
      if (a < this.urls.length) this.decode(a);
      if (d <= this.behind) {
        const b = this.target - d;
        if (b >= 0) this.decode(b);
      }
      if (this.decoding.size >= 3) break;
    }
  }

  private evict() {
    if (this.decoded.size <= this.budget) return;
    const far = [...this.decoded.keys()].sort((a, b) => Math.abs(b - this.target) - Math.abs(a - this.target));
    while (this.decoded.size > this.budget && far.length) {
      const i = far.shift()!;
      if (Math.abs(i - this.target) <= 1) break;
      const f = this.decoded.get(i)!;
      if ("close" in f) f.close();
      this.decoded.delete(i);
    }
  }

  private async decode(i: number) {
    const blob = this.blobs[i];
    if (!blob || this.decoded.has(i) || this.decoding.has(i) || this.destroyed) return;
    this.decoding.add(i);
    try {
      let frame: Frame;
      if (typeof createImageBitmap === "function") {
        frame = await createImageBitmap(blob);
      } else {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        await img.decode();
        URL.revokeObjectURL(url);
        frame = img;
      }
      if (this.destroyed || !this.inWindow(i)) {
        // visitor already moved away — keep only if nothing else is decoded
        if (this.destroyed || this.decoded.size > 0) {
          if ("close" in frame) frame.close();
          return;
        }
      }
      this.decoded.set(i, frame);
      this.evict();
      this.onFrame(i);
    } catch {
      /* skip broken frame */
    } finally {
      this.decoding.delete(i);
      if (!this.destroyed) this.decodeWindow();
    }
  }
}
