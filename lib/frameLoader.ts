/**
 * Priority frame loader for the scroll film.
 *
 * Why the old page felt slow: it queued all 241 images at once, so the frames
 * the visitor actually needed waited behind the rest. This loader:
 *  1. loads the first 12 frames first (the film can start immediately);
 *  2. always fetches frames nearest to the current scroll position next,
 *     biased forward (the direction people scroll);
 *  3. fills the rest coarse-to-fine (every 8th, 4th, 2nd…) so a fast scroll
 *     never shows an empty canvas — just a slightly lower frame rate;
 *  4. keeps at most 6 requests in flight and decodes off the main thread
 *     (createImageBitmap / img.decode), so scrolling never stutters.
 */

export type Frame = ImageBitmap | HTMLImageElement;

export class FrameLoader {
  private frames: (Frame | null)[];
  private state: Uint8Array; // 0 = idle, 1 = loading, 2 = done, 3 = failed
  private inFlight = 0;
  private target = 0;
  private destroyed = false;
  private coarseOrder: number[];
  loaded = 0;

  constructor(
    private urls: string[],
    private onFrame: (index: number) => void,
    private maxConcurrent = 6,
  ) {
    this.frames = new Array(urls.length).fill(null);
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

  /** Tell the loader which frame the visitor is looking at now. */
  focus(index: number) {
    this.target = Math.max(0, Math.min(this.urls.length - 1, index));
    this.pump();
  }

  start() {
    this.pump();
  }

  destroy() {
    this.destroyed = true;
    for (const f of this.frames) if (f && "close" in f) f.close();
  }

  /** Nearest frame that is ready — used while the exact one is still loading. */
  nearest(index: number): Frame | null {
    const n = this.frames.length;
    for (let d = 0; d < n; d++) {
      const a = this.frames[index - d];
      if (a) return a;
      const b = this.frames[index + d];
      if (b) return b;
    }
    return null;
  }

  private next(): number {
    const n = this.urls.length;
    // 1) opening frames
    for (let i = 0; i < Math.min(12, n); i++) if (this.state[i] === 0) return i;
    // 2) window around the current position, forward-biased
    for (let d = 0; d < 24; d++) {
      const ahead = this.target + d;
      if (ahead < n && this.state[ahead] === 0) return ahead;
      if (d < 8) {
        const behind = this.target - d;
        if (behind >= 0 && this.state[behind] === 0) return behind;
      }
    }
    // 3) coarse-to-fine fill of the whole film
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
      this.fetchFrame(i).finally(() => {
        this.inFlight--;
        this.pump();
      });
    }
  }

  private async fetchFrame(i: number) {
    try {
      let frame: Frame;
      if (typeof createImageBitmap === "function") {
        const res = await fetch(this.urls[i], { priority: i < 12 ? "high" : "low" } as RequestInit);
        if (!res.ok) throw new Error(String(res.status));
        frame = await createImageBitmap(await res.blob());
      } else {
        const img = new Image();
        img.decoding = "async";
        img.src = this.urls[i];
        await img.decode();
        frame = img;
      }
      if (this.destroyed) {
        if ("close" in frame) frame.close();
        return;
      }
      this.frames[i] = frame;
      this.state[i] = 2;
      this.loaded++;
      this.onFrame(i);
    } catch {
      this.state[i] = 3;
      this.loaded++;
      this.onFrame(i);
    }
  }
}
