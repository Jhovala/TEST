#!/usr/bin/env node
/**
 * generate-placeholder-frames.mjs
 * Genera 90 frames SVG (como placeholder del bot "Sparky") donde los ojos
 * se desplazan según la posición en la rejilla 10x9, imitando la mirada
 * hacia el cursor. Salida: web/public/bot-sequence/frame-XX.svg
 *
 * Cuando tengas el render real de Blender, solo reemplaza estos archivos
 * por frame-XX.webp y cambia la extensión en BotCanvas.tsx (basePath/formato).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const COLS = 10;
const ROWS = 9;
const TOTAL = COLS * ROWS; // 90
const SIZE = 800;

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'web', 'public', 'bot-sequence');
mkdirSync(outDir, { recursive: true });

const svgFor = (col, row) => {
  // Normalizamos 0..1 e invertimos Y (fila 0 = arriba => mira arriba)
  const nx = col / (COLS - 1);
  const ny = row / (ROWS - 1);
  const eyeDX = (nx - 0.5) * 26; // desplazamiento horizontal pupila
  const eyeDY = (ny - 0.5) * 22; // desplazamiento vertical pupila
  const headX = (nx - 0.5) * 14; // parallax sutil de cabeza
  const headY = (ny - 0.5) * 10;

  const eye = (cx) => `
    <g>
      <ellipse cx="${cx}" cy="${330 + headY}" rx="58" ry="62" fill="#0b1020" stroke="#22d3ee" stroke-width="4"/>
      <circle cx="${cx + eyeDX}" cy="${330 + headY + eyeDY}" r="22" fill="#22d3ee"/>
      <circle cx="${cx + eyeDX - 7}" cy="${330 + headY + eyeDY - 8}" r="7" fill="#eafcff" opacity="0.9"/>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b2440"/>
      <stop offset="1" stop-color="#131a30"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#a78bfa" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#a78bfa" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="${400 + headX}" cy="${420}" rx="330" ry="330" fill="url(#glow)"/>
  <!-- antena -->
  <line x1="${400 + headX}" y1="${150 + headY}" x2="${400 + headX}" y2="${95 + headY}" stroke="#a78bfa" stroke-width="8" stroke-linecap="round"/>
  <circle cx="${400 + headX}" cy="${85 + headY}" r="14" fill="#a78bfa"/>
  <!-- cuerpo/cabeza -->
  <rect x="${170 + headX}" y="${170 + headY}" width="${460}" height="${420}" rx="120" fill="url(#body)" stroke="#2c3a63" stroke-width="6"/>
  <!-- visor -->
  <rect x="${215 + headX}" y="${255 + headY}" width="${370}" height="${160}" rx="80" fill="#0e1428" stroke="#22d3ee" stroke-width="3" opacity="0.95"/>
  ${eye(310 + headX)}
  ${eye(490 + headX)}
  <!-- boca -->
  <path d="M ${340 + headX} ${470 + headY} Q ${400 + headX} ${500 + headY} ${460 + headX} ${470 + headY}" stroke="#22d3ee" stroke-width="8" fill="none" stroke-linecap="round"/>
</svg>`;
};

for (let i = 0; i < TOTAL; i++) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const name = `frame-${String(i).padStart(2, '0')}.svg`;
  writeFileSync(join(outDir, name), svgFor(col, row));
}

console.log(`✔ ${TOTAL} frames placeholder generados en ${outDir}`);
console.log('  Nota: son SVG para prototipar ya; sustitúyelos por WebP reales de Blender.');
