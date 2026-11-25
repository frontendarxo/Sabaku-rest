"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { backlightTexture, linenTexture } from "@/lib/textures";

/**
 * Two linen noren panels simulated as real cloth (Verlet integration).
 *  - the top edge hangs from loops on a wooden rod; opening slides the loops outward and
 *    gathers them into an accordion, so the cloth folds by itself and leaves the screen;
 *  - the split is exactly in the centre of the screen;
 *  - light behind the cloth shows through the weave (warm when the lamp is on, dim when off);
 *  - the cursor / finger brushes the fabric.
 */

export interface CurtainDrive {
  scroll: number; // 0..1 from page scroll
  drag: number; // -1..1 offset from dragging by hand
  pointer: { x: number; y: number; vx: number; active: boolean }; // NDC
}

const NX = 24;
const NY = 34;

interface Sim {
  pos: Float32Array;
  prev: Float32Array;
  ca: Uint16Array;
  cb: Uint16Array;
  rest: Float32Array;
  stiff: Float32Array;
  sx: number;
  sy: number;
}

function buildSim(width: number, height: number, left: boolean, top: number): Sim {
  const sx = width / (NX - 1);
  const sy = height / (NY - 1);
  const n = NX * NY;
  const pos = new Float32Array(n * 3);
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const k = (j * NX + i) * 3;
      pos[k] = left ? -width + i * sx : i * sx;
      pos[k + 1] = top - j * sy;
      pos[k + 2] = 0;
    }
  const a: number[] = [];
  const b: number[] = [];
  const r: number[] = [];
  const s: number[] = [];
  const add = (p: number, q: number, st: number) => {
    a.push(p);
    b.push(q);
    const dx = pos[p * 3] - pos[q * 3];
    const dy = pos[p * 3 + 1] - pos[q * 3 + 1];
    r.push(Math.hypot(dx, dy));
    s.push(st);
  };
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const id = j * NX + i;
      if (i < NX - 1) add(id, id + 1, 1);
      if (j < NY - 1) add(id, id + NX, 1);
      if (i < NX - 1 && j < NY - 1) {
        add(id, id + NX + 1, 0.5);
        add(id + 1, id + NX, 0.5);
      }
      if (i < NX - 2) add(id, id + 2, 0.25); // bending
      if (j < NY - 2) add(id, id + NX * 2, 0.25);
    }
  return {
    pos,
    prev: pos.slice(),
    ca: Uint16Array.from(a),
    cb: Uint16Array.from(b),
    rest: Float32Array.from(r),
    stiff: Float32Array.from(s),
    sx,
    sy,
  };
}

function Panel({
  left,
  W,
  H,
  drive,
  lit,
}: {
  left: boolean;
  W: number;
  H: number;
  drive: MutableRefObject<CurtainDrive>;
  lit: boolean;
}) {
  const top = H / 2 - 0.045; // the rod shows just below the top edge
  const width = W / 2 + 0.004; // tiny overlap at the seam: no gap when closed
  const sim = useMemo(() => buildSim(width, H * 1.02, left, top), [width, H, left, top]);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, NX - 1, NY - 1), []);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const level = useRef(lit ? 1 : 0);
  const eased = useRef(0);
  const textures = useMemo(() => {
    const map = linenTexture(1024, left ? 7 : 9);
    map.repeat.set(1.3, 1.7);
    const bump = map.clone();
    bump.colorSpace = THREE.NoColorSpace;
    bump.repeat.set(1.3, 1.7);
    // light sits behind the centre of the screen → brightest near the seam
    const back = backlightTexture(left ? 0.82 : 0.18, 0.52, 512, left ? 11 : 13);
    return { map, bump, back };
  }, [left]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const d = drive.current;
    const raw = Math.min(1, Math.max(0, d.scroll + d.drag));
    // the loops slide along the rod at a limited speed — a fast scroll never whips the cloth
    const goal = raw * raw * (3 - 2 * raw);
    const maxStep = dt * 0.9;
    eased.current += Math.max(-maxStep, Math.min(maxStep, (goal - eased.current) * Math.min(1, dt * 5)));
    const o = eased.current;
    const { pos, prev, ca, cb, rest, stiff, sx } = sim;
    const n = NX * NY;

    // pin targets for the top row (accordion that preserves cloth length)
    const gathered = 0.15 * W / (NX - 1);
    const spacing = sx + (gathered - sx) * o;
    // a soft natural drape even when closed, deeper accordion folds as it gathers
    const pleat = 0.5 * Math.sqrt(Math.max(0, sx * sx - spacing * spacing)) + sx * 0.12;
    const outerOpen = W / 2 + 0.32 * W;
    const pinX = (i: number) => {
      const closed = left ? -width + i * sx : i * sx;
      const open = left ? -outerOpen + i * gathered : outerOpen - (NX - 1 - i) * gathered;
      return closed + (open - closed) * o;
    };

    // pointer in world space (plane z = 0)
    const px = (d.pointer.x * W) / 2;
    const py = (d.pointer.y * H) / 2;
    const t = state.clock.elapsedTime;
    const g = -H * 3.2;

    const sub = 2;
    const h = dt / sub;
    for (let s = 0; s < sub; s++) {
      for (let p = 0; p < n; p++) {
        const k = p * 3;
        const y = pos[k + 1];
        const vx = (pos[k] - prev[k]) * 0.972;
        const vy = (pos[k + 1] - prev[k + 1]) * 0.972;
        const vz = (pos[k + 2] - prev[k + 2]) * 0.972;
        prev[k] = pos[k];
        prev[k + 1] = pos[k + 1];
        prev[k + 2] = pos[k + 2];
        // gentle air movement, stronger lower down
        const depth = (top - y) / H;
        let fz = Math.sin(t * 0.7 + pos[k] * 2.1) * 0.035 * depth;
        if (d.pointer.active) {
          const dx = pos[k] - px;
          const dy = y - py;
          const r2 = dx * dx + dy * dy;
          if (r2 < 0.09) fz += (1 - r2 / 0.09) * (0.9 + Math.abs(d.pointer.vx) * 6) * (left ? -1 : 1) * 0.6;
        }
        pos[k] += vx;
        pos[k + 1] += vy + g * h * h;
        pos[k + 2] += vz + fz * h * h * 60;
      }
      for (let it = 0; it < 5; it++) {
        for (let c = 0; c < ca.length; c++) {
          const a = ca[c] * 3;
          const b = cb[c] * 3;
          const dx = pos[b] - pos[a];
          const dy = pos[b + 1] - pos[a + 1];
          const dz = pos[b + 2] - pos[a + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
          const diff = ((dist - rest[c]) / dist) * 0.5 * stiff[c];
          pos[a] += dx * diff;
          pos[a + 1] += dy * diff;
          pos[a + 2] += dz * diff;
          pos[b] -= dx * diff;
          pos[b + 1] -= dy * diff;
          pos[b + 2] -= dz * diff;
        }
        for (let i = 0; i < NX; i++) {
          const k = i * 3;
          pos[k] = pinX(i);
          pos[k + 1] = top;
          pos[k + 2] = (i % 2 ? 1 : -1) * pleat;
        }
      }
    }

    const attr = geo.attributes.position as THREE.BufferAttribute;
    (attr.array as Float32Array).set(pos);
    attr.needsUpdate = true;
    geo.computeVertexNormals();

    // backlight follows the lamp switch
    level.current += ((lit ? 1 : 0) - level.current) * Math.min(1, dt * 3);
    const l = level.current;
    if (mat.current) {
      mat.current.emissiveIntensity = 0.04 + l * 1.15;
      mat.current.color.setRGB(0.56 + l * 0.4, 0.52 + l * 0.38, 0.47 + l * 0.32);
    }
  });

  return (
    <mesh geometry={geo} frustumCulled={false}>
      <meshPhysicalMaterial
        ref={mat}
        map={textures.map}
        bumpMap={textures.bump}
        bumpScale={0.5}
        roughness={0.93}
        sheen={0.7}
        sheenRoughness={0.75}
        sheenColor="#fff0d2"
        emissive="#ffb06a"
        emissiveMap={textures.back}
        emissiveIntensity={lit ? 1.2 : 0.04}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Scene({ drive, lit }: { drive: MutableRefObject<CurtainDrive>; lit: boolean }) {
  const { viewport } = useThree();
  // world size of the screen at z = 0 — the curtain fills it edge to edge
  const W = viewport.width;
  const H = viewport.height;
  return (
    <>
      <hemisphereLight args={["#fff4e2", "#3a2c20", lit ? 0.55 : 0.35]} />
      <directionalLight position={[1.5, 2, 4]} intensity={lit ? 0.7 : 0.45} color="#fff1dc" />
      <Panel key={`l${W.toFixed(2)}`} left W={W} H={H} drive={drive} lit={lit} />
      <Panel key={`r${W.toFixed(2)}`} left={false} W={W} H={H} drive={drive} lit={lit} />
      {/* the rod */}
      <mesh position={[0, H / 2 - 0.015, 0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.028, 0.028, W * 1.8, 20]} />
        <meshStandardMaterial color="#5b3d26" roughness={0.6} />
      </mesh>
    </>
  );
}

export default function NorenCurtain3D({
  drive,
  lit,
  onReady,
}: {
  drive: MutableRefObject<CurtainDrive>;
  lit: boolean;
  onReady?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "pan-y" }}
      onCreated={() => requestAnimationFrame(() => onReady?.())}
    >
      <Scene drive={drive} lit={lit} />
    </Canvas>
  );
}
