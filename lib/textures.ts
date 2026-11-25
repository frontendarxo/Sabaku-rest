import * as THREE from "three";

/** Procedural textures — crisp at any size, nothing extra to download. */

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Linen weave: warp + weft threads with slubs. Used as colour and bump. */
export function linenTexture(size = 1024, seed = 7) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = rand(seed);
  g.fillStyle = "#d9c7a6";
  g.fillRect(0, 0, size, size);
  const step = size / 220;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < size; i += step) {
      const l = 70 + r() * 40;
      g.strokeStyle = `hsla(38, 35%, ${l}%, ${0.18 + r() * 0.22})`;
      g.lineWidth = step * (0.45 + r() * 0.5);
      g.beginPath();
      if (pass === 0) {
        g.moveTo(i + r() * 0.6, 0);
        g.lineTo(i + r() * 0.6, size);
      } else {
        g.moveTo(0, i + r() * 0.6);
        g.lineTo(size, i + r() * 0.6);
      }
      g.stroke();
    }
  }
  // slubs — thicker irregular threads typical for linen
  for (let k = 0; k < 900; k++) {
    const x = r() * size;
    const y = r() * size;
    const len = 10 + r() * 60;
    g.strokeStyle = `hsla(36, 30%, ${r() < 0.5 ? 60 : 88}%, ${0.15 + r() * 0.25})`;
    g.lineWidth = 1 + r() * 2;
    g.beginPath();
    if (r() < 0.5) {
      g.moveTo(x, y);
      g.lineTo(x + len, y + r() * 2);
    } else {
      g.moveTo(x, y);
      g.lineTo(x + r() * 2, y + len);
    }
    g.stroke();
  }
  // low-frequency unevenness of hand-woven linen (hides tiling)
  for (let k = 0; k < 70; k++) {
    const x = r() * size;
    const y = r() * size;
    const rad = 40 + r() * 180;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const light = r() < 0.5;
    gr.addColorStop(0, light ? "rgba(255,248,232,0.10)" : "rgba(120,96,64,0.08)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Light passing THROUGH the cloth: bright in the gaps of the weave and strongest
 * where the light source sits behind the panel (glowX, glowY in UV space).
 */
export function backlightTexture(glowX: number, glowY: number, size = 512, seed = 11) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = rand(seed);
  const grad = g.createRadialGradient(glowX * size, (1 - glowY) * size, 0, glowX * size, (1 - glowY) * size, size * 0.9);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.35, "#a8a8a8");
  grad.addColorStop(1, "#262626");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  // weave modulation — threads block light, gaps let it through
  g.globalCompositeOperation = "multiply";
  const step = size / 110;
  for (let i = 0; i < size; i += step) {
    g.fillStyle = `rgba(150,150,150,${0.25 + r() * 0.2})`;
    g.fillRect(i, 0, step * 0.55, size);
    g.fillRect(0, i, size, step * 0.55);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Washi paper with long fibres for the Akari shade. */
export function washiTexture(size = 1024, seed = 3) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const r = rand(seed);
  g.fillStyle = "#f1e7d4";
  g.fillRect(0, 0, size, size);
  for (let k = 0; k < 4200; k++) {
    const x = r() * size;
    const y = r() * size;
    const a = r() * Math.PI * 2;
    const len = 8 + r() * 46;
    g.strokeStyle = `rgba(${r() < 0.6 ? "255,250,240" : "190,170,140"},${0.08 + r() * 0.18})`;
    g.lineWidth = 0.4 + r() * 1.1;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (r() - 0.5) * 6, y + Math.sin(a) * len * 0.5 + (r() - 0.5) * 6, x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  // a few denser patches like real handmade paper
  for (let k = 0; k < 60; k++) {
    g.fillStyle = `rgba(200,180,150,${0.03 + r() * 0.04})`;
    g.beginPath();
    g.arc(r() * size, r() * size, 10 + r() * 50, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Soft radial sprite used as a cheap, smooth bloom around light sources. */
export function glowTexture(size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,214,150,1)");
  grad.addColorStop(0.25, "rgba(255,180,96,0.55)");
  grad.addColorStop(0.6, "rgba(255,160,70,0.12)");
  grad.addColorStop(1, "rgba(255,150,60,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
