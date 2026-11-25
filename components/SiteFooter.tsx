"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useLight } from "@/lib/light";

const AkariLamp = dynamic(() => import("./AkariLamp"), { ssr: false });

/**
 * The footer is the room's oak floor; the Akari lamp stands on it and lights it.
 * The same switch dims the curtain and the Visit block above.
 */
export default function SiteFooter() {
  const { on, toggle } = useLight();
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: "150% 0px" });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  return (
    <footer className={`floor ${on ? "lit" : "dark"}`} ref={ref}>
      <div className="floor-lamp" aria-label="Akari paper lamp — tap to switch the light">
        {near && <AkariLamp on={on} onToggle={toggle} />}
      </div>
      <div className="floor-row">
        <span>
          SABAKU · <span lang="ar">سباكو</span> · Aljada, Sharjah
        </span>
        <span>
          Website · <a href="https://t.me/salamov5dev">@salamov5dev</a>
        </span>
      </div>
    </footer>
  );
}
