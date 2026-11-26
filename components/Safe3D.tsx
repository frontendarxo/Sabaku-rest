"use client";

import { Component, type ReactNode } from "react";

/**
 * Keeps a 3D failure local: if WebGL can't start (old phone, low memory,
 * context lost) the page keeps working and the static fallback stays visible.
 */
export default class Safe3D extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[3D disabled]", err);
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}

/** Lower pixel ratio on phones: same look, a fraction of the GPU memory. */
export const mobileDpr = (): [number, number] =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches ? [1, 1.5] : [1, 2];
