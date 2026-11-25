"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * One shared "is the lamp on" state for the end of the page:
 * the noren curtain glows with what is behind it, the Visit block warms up,
 * and the Akari lamp on the footer floor shines — all from the same switch.
 */
const LightCtx = createContext<{ on: boolean; toggle: () => void }>({ on: true, toggle: () => {} });

export function LightProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(true);
  return <LightCtx.Provider value={{ on, toggle: () => setOn((v) => !v) }}>{children}</LightCtx.Provider>;
}

export const useLight = () => useContext(LightCtx);
