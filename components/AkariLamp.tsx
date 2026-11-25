"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { glowTexture, washiTexture } from "@/lib/textures";

/**
 * Akari floor lamp, standing on the footer floor. Built in code:
 * washi-paper shade with a fine bamboo spiral, wire rings, slim metal tripod,
 * a soft bloom around the shade and a warm pool of light on the floor.
 * Click / tap toggles the light (shared with the curtain and the Visit block).
 */

const SH = 0.56; // shade height
const SR = 0.33; // shade radius
const SHADE_Y = 0.62; // shade centre above the floor

const rOf = (y: number) => {
  const t = y / (SH / 2);
  return Math.max(0.085, SR * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(t), 2.15) * 0.97)));
};

function Lamp({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const root = useRef<THREE.Group>(null);
  const shade = useRef<THREE.MeshPhysicalMaterial>(null);
  const bulb = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const halo = useRef<THREE.SpriteMaterial>(null);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  const level = useRef(on ? 1 : 0);
  const [hover, setHover] = useState(false);

  const { shadeGeo, ribGeo, rings, legs, tex } = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 60; i++) {
      const y = -SH / 2 + (SH * i) / 60;
      pts.push(new THREE.Vector2(rOf(y), y));
    }
    const shadeGeo = new THREE.LatheGeometry(pts, 96);

    const turns = 15;
    const spiral: THREE.Vector3[] = [];
    for (let i = 0; i <= 900; i++) {
      const k = i / 900;
      const y = -SH / 2 + 0.012 + (SH - 0.024) * k;
      const r = rOf(y) + 0.0015;
      const a = k * turns * Math.PI * 2;
      spiral.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    const ribGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 1400, 0.0011, 5, false);

    const rings = [-SH / 2 + 0.006, SH / 2 - 0.006].map((y) => ({ y, r: rOf(y) }));

    const legs = [0, 1, 2].map((n) => {
      const a = (n / 3) * Math.PI * 2 + 0.5;
      const top = new THREE.Vector3(0, SHADE_Y - SH / 2 - 0.04, 0);
      const foot = new THREE.Vector3(Math.cos(a) * 0.26, 0.012, Math.sin(a) * 0.26);
      const mid = top.clone().add(foot).multiplyScalar(0.5);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), foot.clone().sub(top).normalize());
      return { mid, q, len: top.distanceTo(foot), foot };
    });

    const map = washiTexture(1024, 3);
    map.repeat.set(2, 1);
    return { shadeGeo, ribGeo, rings, legs, tex: { map, glow: glowTexture(256) } };
  }, []);

  useFrame((state, dt) => {
    level.current += ((on ? 1 : 0) - level.current) * Math.min(1, dt * 3.2);
    const l = level.current;
    if (shade.current) {
      shade.current.emissiveIntensity = 0.02 + l * 1.75;
      shade.current.color.setRGB(0.72 + l * 0.22, 0.68 + l * 0.2, 0.6 + l * 0.15);
    }
    if (bulb.current) bulb.current.emissiveIntensity = l * 6;
    if (light.current) light.current.intensity = l * 3.2;
    if (halo.current) halo.current.opacity = l * 0.85;
    if (pool.current) pool.current.opacity = l * 0.55;
    if (root.current) {
      const s = hover ? 1.025 : 1;
      root.current.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, dt * 8));
      root.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.25;
    }
  });

  const metal = <meshStandardMaterial color="#1d1915" metalness={0.65} roughness={0.35} />;

  return (
    <group
      ref={root}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onPointerOver={() => {
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
    >
      {/* washi shade */}
      <mesh geometry={shadeGeo} position={[0, SHADE_Y, 0]}>
        <meshPhysicalMaterial
          ref={shade}
          map={tex.map}
          color="#efe4cf"
          emissive="#ffb766"
          emissiveMap={tex.map}
          emissiveIntensity={on ? 1.75 : 0.02}
          roughness={1}
          sheen={0.35}
          sheenColor="#fff4e0"
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={ribGeo} position={[0, SHADE_Y, 0]}>
        <meshStandardMaterial color="#b59b78" roughness={0.85} transparent opacity={0.85} />
      </mesh>
      {rings.map((r, i) => (
        <mesh key={i} position={[0, SHADE_Y + r.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r.r, 0.0025, 6, 48]} />
          {metal}
        </mesh>
      ))}
      {/* bulb, light, bloom */}
      <mesh position={[0, SHADE_Y - 0.02, 0]}>
        <sphereGeometry args={[0.045, 24, 16]} />
        <meshStandardMaterial ref={bulb} color="#fff6e3" emissive="#ffd99a" emissiveIntensity={on ? 6 : 0} />
      </mesh>
      <pointLight ref={light} position={[0, SHADE_Y, 0]} color="#ffbe78" intensity={on ? 3.2 : 0} distance={3} decay={2} />
      <sprite position={[0, SHADE_Y, 0.02]} scale={[0.92, 0.92, 1]} renderOrder={10}>
        <spriteMaterial ref={halo} map={tex.glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={on ? 0.85 : 0} />
      </sprite>
      {/* centre stem + tripod */}
      <mesh position={[0, SHADE_Y - SH / 2 - 0.02, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.06, 8]} />
        {metal}
      </mesh>
      {legs.map((leg, i) => (
        <group key={i}>
          <mesh position={leg.mid} quaternion={leg.q}>
            <cylinderGeometry args={[0.0045, 0.0045, leg.len, 8]} />
            {metal}
          </mesh>
          <mesh position={leg.foot}>
            <sphereGeometry args={[0.011, 12, 8]} />
            {metal}
          </mesh>
        </group>
      ))}
      {/* warm pool of light on the floor */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
        <planeGeometry args={[0.95, 0.55]} />
        <meshBasicMaterial ref={pool} map={tex.glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={on ? 0.55 : 0} />
      </mesh>
    </group>
  );
}

export default function AkariLamp({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.6, 2.45], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "pan-y" }}
      onCreated={({ camera }) => camera.lookAt(0, 0.6, 0)}
    >
      <ambientLight intensity={on ? 0.22 : 0.4} />
      <directionalLight position={[-2, 3, 2]} intensity={on ? 0.2 : 0.55} color="#e8eefc" />
      <Lamp on={on} onToggle={onToggle} />
      <ContactShadows position={[0, 0.003, 0]} opacity={0.6} scale={2.4} blur={2.2} far={1.2} color="#000000" />
    </Canvas>
  );
}
