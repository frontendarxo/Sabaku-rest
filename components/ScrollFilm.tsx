"use client";

import { useEffect, useRef, useState } from "react";
import { CAPTIONS, FRAME_COUNT, FRAME_SETS, focalAt, frameUrl, pickFrameSet, type FrameSet } from "@/lib/film";
import { FrameLoader, type Frame } from "@/lib/frameLoader";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Draws one frame so it looks the same on every screen:
 *  - "cover" crop centred on the focal point for this moment of the film, clamped to the frame edges;
 *  - never cropping past the set's safe zone — on extreme ratios the frame shrinks a little
 *    and the gaps are filled with a blurred, darkened copy of the same frame.
 */
function drawFrame(ctx: CanvasRenderingContext2D, img: Frame, set: FrameSet, progress: number, orientation: "landscape" | "portrait") {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const iw = img.width;
  const ih = img.height;

  const cover = Math.max(cw / iw, ch / ih);
  const scale = Math.min(cover, cw / (iw * set.safeW), ch / (ih * set.safeH));
  const w = iw * scale;
  const h = ih * scale;

  const [fx, fy] = focalAt(progress, orientation);
  const place = (size: number, drawn: number, focal: number) =>
    drawn <= size ? (size - drawn) / 2 : clamp(size / 2 - focal * drawn, size - drawn, 0);
  const x = place(cw, w, fx);
  const y = place(ch, h, fy);

  if (scale < cover - 1e-6) {
    const bw = iw * cover;
    const bh = ih * cover;
    ctx.save();
    ctx.filter = "blur(28px) brightness(0.55)";
    ctx.drawImage(img, (cw - bw) / 2, (ch - bh) / 2, bw, bh);
    ctx.restore();
  }
  ctx.drawImage(img, x, y, w, h);
}

export default function ScrollFilm() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hint = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const { set, step } = pickFrameSet();
    const orientation = set.id === "portrait" ? "portrait" : "landscape";
    const indices: number[] = [];
    for (let i = 0; i < FRAME_COUNT; i += step) indices.push(i);
    if (indices[indices.length - 1] !== FRAME_COUNT - 1) indices.push(FRAME_COUNT - 1);

    let target = 0;
    let current = 0;
    let drawn = -1;
    let raf = 0;
    let lastPct = 0;

    const loader = new FrameLoader(
      indices.map((i) => frameUrl(set, i)),
      (i) => {
        if (Math.abs(i - Math.round(current * (indices.length - 1))) < 3) drawn = -1;
        if (i === 0) setReady(true);
        const pct = Math.round((loader.loaded / loader.total) * 100);
        if (pct !== lastPct) {
          lastPct = pct;
          setProgress(pct);
        }
      },
    );

    const resize = () => {
      const r = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * r);
      canvas.height = Math.round(canvas.clientHeight * r);
      drawn = -1;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const readScroll = () => {
      const r = section.getBoundingClientRect();
      target = clamp(-r.top / (r.height - window.innerHeight));
    };

    const tick = () => {
      current += (target - current) * (reduce ? 1 : 0.12);
      const slot = Math.round(current * (indices.length - 1));
      loader.focus(slot);
      if (slot !== drawn) {
        const img = loader.nearest(slot);
        if (img) {
          drawFrame(ctx, img, set, current, orientation);
          drawn = slot;
        }
      }
      CAPTIONS.forEach((c, k) => {
        const el = captionRefs.current[k];
        if (!el) return;
        const v = smooth(c.show[0], c.show[1], current) * (1 - smooth(c.hide[0], c.hide[1], current));
        el.style.opacity = String(v);
        el.style.transform = `${c.at === "center" ? "translateY(-50%) " : ""}translateY(${(1 - v) * 14}px)`;
      });
      if (hint.current) hint.current.style.opacity = String(1 - smooth(0, 0.04, current));
      raf = requestAnimationFrame(tick);
    };

    resize();
    readScroll();
    window.addEventListener("scroll", readScroll, { passive: true });
    loader.start();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", readScroll);
      ro.disconnect();
      loader.destroy();
    };
  }, []);

  return (
    <section className="film" id="top" ref={sectionRef}>
      <div className="stage">
        {/* Instant first paint: first frame as <picture>, chosen by screen shape (LCP image). */}
        <picture className={`poster ${ready ? "hide" : ""}`}>
          <source media="(max-aspect-ratio: 4/5)" srcSet={frameUrl(FRAME_SETS.portrait, 0)} />
          <source media="(min-width: 1800px)" srcSet={frameUrl(FRAME_SETS.hd, 0)} />
          <img src={frameUrl(FRAME_SETS.sd, 0)} alt="" fetchPriority="high" decoding="async" />
        </picture>
        <canvas ref={canvasRef} aria-label="Walking into Sabaku in Aljada, sitting down, and being served pancakes, matcha and sencha" />
        <div className="shade" />
        {CAPTIONS.map((c, k) => {
          const Title = "h1" in c && c.h1 ? "h1" : "h2";
          return (
            <div
              key={c.id}
              className={`cap-ov at-${c.at}`}
              ref={(el) => {
                captionRefs.current[k] = el;
              }}
              style={{ opacity: k === 0 ? 1 : 0 }}
            >
              <Title className="cap">
                {c.title.map((line, n) => (
                  <span key={n} className="line">
                    {line}
                  </span>
                ))}
              </Title>
              {"text" in c && <p>{c.text}</p>}
            </div>
          );
        })}
        <div className="load" style={{ opacity: progress >= 100 ? 0 : 1 }} aria-hidden>
          <i style={{ width: `${progress}%` }} />
        </div>
        <div className="hint" ref={hint}>
          Scroll to enter
        </div>
      </div>
    </section>
  );
}
