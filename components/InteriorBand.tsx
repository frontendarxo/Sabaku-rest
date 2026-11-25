"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * A full-bleed photo of the real interior with a slow parallax drift.
 * Used sparingly (menu header, before Visit) so it frames the content instead of competing with it.
 */
export default function InteriorBand({
  src,
  alt,
  children,
  height = "clamp(280px, 52vh, 560px)",
  focus = "50% 50%",
  tone = "dark",
}: {
  src: StaticImageData;
  alt: string;
  children?: ReactNode;
  height?: string;
  focus?: string;
  tone?: "dark" | "light";
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const t = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight; // -1..1
        el.style.setProperty("--py", `${(t * -6).toFixed(2)}%`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className={`band-photo ${tone}`} ref={box} style={{ height }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        quality={82}
        placeholder="blur"
        style={{ objectFit: "cover", objectPosition: focus }}
      />
      {children && <div className="band-copy">{children}</div>}
    </div>
  );
}
