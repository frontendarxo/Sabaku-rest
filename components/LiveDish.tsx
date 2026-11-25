"use client";

import { useEffect, useRef } from "react";

interface Props {
  id: string;
  label: string;
  title: string;
  note: string;
  text: string;
  price?: number;
  video: string;
  poster: string;
  flip?: boolean;
  cup?: boolean;
}

/**
 * A dish chapter with a looping video.
 * Loading: preload="none" + poster, the video file is attached only when the
 * section is ~1 screen away, and it plays only while visible.
 * Framing: fixed 1:1 box + object-fit: cover, so the dish is framed identically on every screen.
 */
export default function LiveDish({ id, label, title, note, text, price, video, poster, flip, cup }: Props) {
  const fig = useRef<HTMLElement>(null);
  const vid = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = vid.current!;
    const f = fig.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !v.src) {
          v.src = video;
          near.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    near.observe(f);

    const vis = new IntersectionObserver(
      ([e]) => {
        if (reduce) return;
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    vis.observe(f);

    const grow = () => {
      const r = f.getBoundingClientRect();
      const t = clamp01(1 - r.top / (window.innerHeight * 0.9));
      f.style.setProperty("--sc", (0.92 + 0.08 * (reduce ? 1 : t)).toFixed(3));
    };
    window.addEventListener("scroll", grow, { passive: true });
    grow();

    return () => {
      near.disconnect();
      vis.disconnect();
      window.removeEventListener("scroll", grow);
    };
  }, [video]);

  return (
    <section className={`ch${flip ? " flip" : ""}`} id={id}>
      <div className="ch-wrap">
        <figure className="live" ref={fig}>
          <video ref={vid} poster={poster} muted loop playsInline preload="none" aria-label={title} />
        </figure>
        <div>
          <div className="lbl">{label}</div>
          <h2 className="cap">{title}</h2>
          <p className="it">{note}</p>
          <p>{text}</p>
          {price !== undefined && (
            <div className="price">
              <span className="lbl">AED</span>
              <b>{price}</b>
            </div>
          )}
          {cup && <CupIcon className="cupicon" />}
        </div>
      </div>
    </section>
  );
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

export function CupIcon({ className, width }: { className?: string; width?: number }) {
  return (
    <svg className={className} width={width} viewBox="0 0 44 38" aria-hidden>
      <path d="M4 8c0 16 6 27 18 27S40 24 40 8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <ellipse cx="22" cy="8" rx="18" ry="5" fill="currentColor" />
    </svg>
  );
}
