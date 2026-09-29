# Propuestas — Scowlby AI Landing (bot animado)

> Documento de decisiones. Referencia de layout/UX: scrolltide.co/templates/scowlby
> (no se copian assets ni código propietario; mascota y gráficos desde cero).

Estado del repo: Spec-Kit instalado (`.specify/`), README con concepto, stack y
arquitectura atómica. **Aún no hay scaffold de Vite** → propuesto en §8.

---

## 1. Nombre e identidad del bot

| Opción | Nombre | Personalidad | Visual |
|---|---|---|---|
| **A (recomendada)** | **Sparky ⚡** | Curioso, brillante, algo travieso | Cuerpo redondeado índigo, antena con punta luminosa que pulsa según estado |
| B | Glitch | Cómico-caótico, "errores" adorables | Asimetrías intencionales, colores duotono coral/crema |
| C | Nova | Elegante, premium, minimal | Forma de gota violeta, sin rostro explícito (solo ojos), acentos mint |

Recomendación: **A** — mantiene el espíritu "gruñón pero adorable" de Scowlby
traducido a IA, y da juego para los 4 estados emocionales (§2).

## 2. Sistema de estados del bot (la pieza diferenciadora)

El bot reacciona a lo que hace el usuario en la página (equivalente a la cola del perro):

| Estado | Disparador | Animación |
|---|---|---|
| `idle` | por defecto | flotación suave + parpadeo aleatorio + ojos siguen al cursor |
| `thinking` | sección pricing/features visible / foco en input | antena gira, ojos miran arriba-derecha, engranaje/sparkles |
| `happy` | hover/click en CTA, submit de newsletter | salta, ojos ^_^, confeti de chispas |
| `error` | validación fallida del formulario | se apaga medio segundo, ojos x_x, zzz |

Implementación: máquina de estados trivial (`useBotState`) + SVG con capas CSS
(`data-state` selector). Sin librerías: keyframes + `requestAnimationFrame` para
los ojos. Fallback estático con `prefers-reduced-motion`.

## 3. Paleta — dos direcciones

**Opción 1 (recomendada): "cálido + tech"** — la del README actual
```css
--cream:#FFF6E9; --ink:#1F1B2E; --indigo:#5B4BFF;
--violet:#9D7BFF; --mint:#6EE7C7; --coral:#FF7A5C;
```
Conserva las cremas de Scowlby y añade identidad IA. Contraste AA verifiable sobre tokens.

**Opción 2: "cremos + neón nocturno"** — fondo oscuro `#141021` con crema solo en
texto/acentos. Más "producto dev-tool", menos cercano. Riesgo: se aleja del espíritu
juguetón de la referencia.

## 4. Tipografía

| Rol | Opción A (rec.) | Opción B |
|---|---|---|
| Display/headlines | **Fraunces** (serif soft, muy "Scowlby") | Space Grotesk |
| Cuerpo/UI | **Outfit** (geométrica limpia) | Inter |

Ambas en Google Fonts con `font-display: swap`, subsets latin. Pesos: 400/600/700/900.

## 5. CSS: Modules vs Tailwind

| | CSS Modules + tokens.css | Tailwind v4 |
|---|---|---|
| Atomic design | Encaje natural (cada átomo su propio `.module.css`) | Útil pero clases utilitarias dispersas |
| Bundle | ~0 (CSS puro) | mínimo también v4 |
| Velocidad iteración | media | alta |
| Riesgo | duplicar valores si no usamos tokens | vendor-lockin estilístico leve |

**Recomendación: híbrido** — `tokens.css` como fuente única de verdad + **CSS Modules**.
Si prefieres velocidad y ya dominas Tailwind, Plan B: Tailwind consumiendo los mismos
tokens vía `@theme`. La decisión es tuya; ambas respetan la estructura atómica.

## 6. Animaciones: niveles de inversión

- **Nivel 1 (MVP, recomendado)**: CSS keyframes + IntersectionObserver + rAF. Cero deps.
- **Nivel 2**: + Framer Motion para transiciones de sección (stagger reveals).
- **Nivel 3**: Rive/Lottie para el bot (más rico, pero asset externo + runtime ~30-50 KB).

Empezar en Nivel 1; escalar a 2/3 solo si el bot "se siente muerto".

## 7. Contenido de la landing (¿qué vendemos?)

| Escenario | Hero copy (borrador) | Secciones extra |
|---|---|---|
| **A: agente/producto IA ficticio (rec.)** | "Tu copiloto con personalidad" | features, showcase, pricing, newsletter |
| B: plantilla demo (como ScrollTide) | "La landing animada para tu producto IA" | preview variantes, licencia/descarga |
| C: portafolio/personal | "Hola, soy X y construyo con IA" | casos, contacto |

## 8. Siguiente paso inmediato — scaffold

```bash
npm create vite@latest scowlby-ai -- --template react-ts
cd scowlby-ai && npm i -D vitest @testing-library/react jsdom prettier eslint-config-prettier
mkdir -p src/{atoms,molecules,organisms,templates,pages,hooks,styles,assets/svg}
```
Iteraciones propuestas:
1. **I1**: tokens.css + átomos (Button, Heading, Text, Icon) + bot SVG estático.
2. **I2**: hooks (cursor-follow, reduced-motion, bot-state) + 4 estados animados.
3. **I3**: organisms (Header, HeroBotSection, FeaturesGrid, NewsletterForm, Footer).
4. **I4**: HomePage + SEO/a11y/perf pass + Lighthouse ≥ 95.

Tests Vitest desde I1 para átomos y la máquina de estados del bot (TDD vía `/speckit-implement`).

## 9. Spec-Kit: orden sugerido

1. `/speckit-constitution` — principios: a11y AA, perf <120 KB gzip, sin clones de assets, atomicidad obligatoria.
2. `/speckit-specify` — user stories: visitante ve hero→bot reacciona; usuario envía newsletter→bot celebra; etc.
3. `/speckit-clarify` — cerrar decisiones §1–§7 pendientes tuyas.
4. `/speckit-plan` + `/speckit-tasks` → genera el plan derivado de este documento.

---

## Resumen: qué necesito de ti (mínimo)

1. **Nombre del bot**: Sparky / otro (§1)
2. **Paleta**: cálido+tech / oscura-neón (§3)
3. **CSS**: Modules+tokens (rec.) / Tailwind (§5)
4. **Objetivo**: producto ficticio / plantilla / portafolio (§7)
5. **¿Scaffold ahora?** Ejecuto §8 y subo I1 completa cuando confirmes.
