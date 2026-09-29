# Guía Técnica: Landing Interactiva con Bot de IA (Sparky)

Experiencia web interactiva inspirada en la técnica de **Scrolltide (Scowlby)**. En lugar de un personaje 3D renderizado en tiempo real mediante WebGL (alto uso de GPU), usamos un **Bot de IA** cuyas direcciones de mirada están **pre-renderizadas** como secuencia de imágenes y se dibujan sobre un `<canvas>` HTML5 guiado por la posición del cursor.

> Estado actual: el proyecto está implementado y funcionando en `web/` con **90 frames placeholder SVG** generados proceduralmente (`tools/generate-placeholder-frames.mjs`). El pipeline Blender→WebP descrito abajo es el siguiente paso para producir los assets definitivos.

---

## 1. Arquitectura y Stack

| Capa | Elección | Nota |
|---|---|---|
| Framework | **React 18 + Vite + TypeScript** | `web/` |
| Estilos | **CSS Modules-lite (BEM) + variables** | Tailwind opcional como migración |
| Interacción | **HTML5 Canvas API + `requestAnimationFrame`** | Sin WebGL, sin three.js |
| Animación UI | CSS transitions (Framer Motion opcional) | |
| Assets 3D | Blender → PNG → WebP (`cwebp`) | Pipeline §2 |
| Estructura | **Atomic Design** (átomos/moléculas/organismos) | Ver árbol abajo |

```
web/src/
├── atoms/BotCanvas/        ← átomo estrella: canvas + preload + idle + giroscopio
├── molecules/HeroSection/  ← copy + CTA + BotCanvas
├── organisms/Header/ Footer/
├── App.tsx                 ← secciones "Técnica" y "Pipeline"
└── index.css               ← design tokens (:root)
```

---

## 2. Pipeline de producción visual (Blender → WebP)

### 2.1 Modelado y rigging de mirada
1. Diseñar el bot (cabeza articulada, ojos luminosos).
2. Crear un Empty `Target_Look`.
3. Restricción **Track To** en cabeza/ojos apuntando a `Target_Look`.

### 2.2 Render de ángulos (rejilla discreta)
Desplazar `Target_Look` en una cuadrícula virtual que cubre la pantalla (no girar la cámara 360°):

- **Rejilla recomendada: 10 columnas × 9 filas = 90 frames** (coincide con `COLUMNS`/`TOTAL_FRAMES` del código).
- Filas 0–2: mirada zona superior · 3–5: centro · 6–8: inferior; cada fila barre izquierda→derecha.
- Salida: **PNG 800×800 con transparencia**, nombrados `frame-00 … frame-89`.

### 2.3 Optimización de assets
```bash
# Batch de conversión (Linux/macOS)
for f in renders/frame_*.png; do cwebp -q 80 "$f" -o "web/public/bot-sequence/$(basename "${f%.png}.webp")"; done
```
Y cambiar en `BotCanvas.tsx` la extensión `.svg` → `.webp` (una sola línea, línea de `loadFrameImage`).

Mientras tanto, los placeholders ya generan el efecto completo:
```bash
node tools/generate-placeholder-frames.mjs   # 90 SVG con pupilas/parallax por rejilla
```

---

## 3. Lógica de interacción (4 pilares)

1. **Precarga**: todas las imágenes entran a memoria antes del render loop (con progreso visible y tolerancia a frames faltantes → sin 404 ni parpadeos).
2. **Mapeo de coordenadas**: `(x, y)` del puntero → normalización [0..1] → índice `[0…N-1]` de la rejilla 10×9.
3. **Render loop**: `requestAnimationFrame` + **lerp/inercia** (`current += (target-current)*0.2`) para movimiento con peso.
4. **Idle state**: 3 s sin movimiento → barrido senoidal sutil (el bot "respira").

Mejoras añadidas sobre la guía original:
- **Táctil** (`touchmove`) y **giroscopio** (`DeviceOrientationEvent`: gamma→X, beta→Y) en móvil.
- **`prefers-reduced-motion`**: desactiva animación y fija mirada al centro (accesibilidad).
- **Cleanup exhaustivo**: listeners, `cancelAnimationFrame`, timers — sin fugas en HMR/unmount.
- **Auto-inventario de frames**: si solo hay 60 renders, funciona igual (sin huecos).

Implementación completa en `web/src/atoms/BotCanvas/BotCanvas.tsx`.

---

## 4. Rendimiento y optimizaciones

1. **Sprite sheet**: consolidar los 90 frames en 1 imagen (ej. 8000×7200 o atlas 4K escalado) → 1 petición HTTP; dibujar con `ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)`. Recomendado cuando el hosting tenga límite de conexiones/conteos caros.
2. **AVIF** en lugar de WebP si el target de navegadores lo permite (~20% menos peso).
3. **Lazy-decode**: `img.decoding = 'async'` ya implícito; considerar `createImageBitmap` para decodificar fuera del main thread si el primer paint pesa.
4. **Presupuesto**: 90 WebP q80 @800px ≈ 3–6 MB total → comprimir a 600px y q70 si el hero ocupa <500px en pantalla (canvas lógico 800 no cambia).
5. **Móvil**: limitar a rejilla 6×5 (30 frames) vía prop `totalFrames`/`columns` para ahorrar ancho de banda.

---

## 5. Cómo ejecutar

```bash
cd web
npm install
npm run dev            # http://localhost:5173  (verificado ✓)
npm run build          # tsc + vite build (verificado ✓, bundle 48 kB gzip)
npm run generate:frames  # regenera placeholders SVG
```

## 6. Roadmap sugerido

- [ ] Reemplazar placeholders por renders reales de Blender (o encargar diseño 2D vectorial animable)
- [ ] Migrar a sprite sheet + `createImageBitmap`
- [ ] Estados emocionales del bot (happy/alert/thinking) con carpetas de frames alternativas
- [ ] Secciones adicionales (features, testimonios) como moléculas atómicas
- [ ] Deploy (Vercel/Netlify/GitHub Pages) + Lighthouse ≥95
- [ ] Opcional: sustituir CSS por Tailwind si prefieres utilidades
