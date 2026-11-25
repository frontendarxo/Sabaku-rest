"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import noren from "@/assets/interior/noren.webp";
import { useLight } from "@/lib/light";
import type { CurtainDrive } from "./NorenCurtain3D";

const NorenCurtain3D = dynamic(() => import("./NorenCurtain3D"), { ssr: false });

/**
 * The way out mirrors the way in: a real cloth noren (3D, simulated) covers the screen and
 * parts as you scroll — or push it aside by hand (drag). The Visit block behind it is
 * pinned while the curtain opens, then scrolls normally.
 */
const OPEN_VH = 0.9;

export default function NorenGate({ children }: { children: ReactNode }) {
  const gate = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const drive = useRef<CurtainDrive>({ scroll: 0, drag: 0, pointer: { x: 0, y: 0, vx: 0, active: false } });
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const { on } = useLight();

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: "150% 0px" });
    io.observe(gate.current!);

    let raf = 0;
    const update = () => {
      const r = gate.current!.getBoundingClientRect();
      drive.current.scroll = Math.min(1, Math.max(0, -r.top / (window.innerHeight * OPEN_VH)));
      const o = Math.min(1, Math.max(0, drive.current.scroll + drive.current.drag));
      if (copy.current) copy.current.style.opacity = String(1 - Math.min(1, o * 2.4));
      // once fully open, let clicks reach the Visit block underneath
      if (curtain.current) curtain.current.style.pointerEvents = o >= 0.98 ? "none" : "auto";
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // push the curtain aside by hand: horizontal drag from the centre outwards opens it
  useEffect(() => {
    const el = curtain.current!;
    let startX = 0;
    let startDrag = 0;
    let dragging = false;
    let lastX = 0;
    const toNdc = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      drive.current.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      drive.current.pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      startX = lastX = e.clientX;
      startDrag = drive.current.drag;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      toNdc(e);
      drive.current.pointer.active = true;
      drive.current.pointer.vx = (e.clientX - lastX) / el.clientWidth;
      lastX = e.clientX;
      if (!dragging) return;
      const r = el.getBoundingClientRect();
      const fromCentre = e.clientX - (r.left + r.width / 2);
      const dx = (e.clientX - startX) * Math.sign(fromCentre || 1);
      drive.current.drag = Math.max(-1, Math.min(1, startDrag + (dx / r.width) * 2.2));
    };
    const up = () => {
      dragging = false;
    };
    const leave = () => {
      drive.current.pointer.active = false;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div className="gate" ref={gate}>
      <div className="gate-body">
        {children}
        <div className="gate-curtain" ref={curtain}>
          {/* still image until the 3D cloth is ready */}
          <div className={`gate-fallback ${ready ? "hide" : ""}`} style={{ backgroundImage: `url(${noren.src})` }} aria-hidden />
          {near && (
            <div className="gate-canvas">
              <NorenCurtain3D drive={drive} lit={on} onReady={() => setReady(true)} />
            </div>
          )}
          <div className="gate-copy" ref={copy} aria-hidden>
            <span className="gate-jp">またね</span>
            <span className="gate-en">See you behind the noren</span>
            <span className="gate-hint">Scroll — or push the curtain aside</span>
          </div>
        </div>
      </div>
      <div style={{ height: `${OPEN_VH * 100}vh` }} aria-hidden />
    </div>
  );
}
