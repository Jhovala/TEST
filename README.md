# Scowlby AI — Landing Page (referencia: scrolltide.co/scowlby)

Landing page de una sola página, juguetona y animada, **inspirada** en la plantilla
[Scowlby de ScrollTide](https://www.scrolltide.co/templates/scowlby). No es un clon:
tomamos su estructura y espíritu (colores cálidos, tipografía display, micro-interacciones,
scroll suave) y **sustituimos el perrito por un bot de IA animado** como mascota/mascot-UI.

> ⚠️ Uso de la referencia: la plantilla de ScrollTide sirve solo como *referencia de
> layout y UX*. No se copian assets, ilustraciones ni código propietario; la mascota
> y los gráficos se crean desde cero (SVG animado propio).

---

## 1. Concepto del producto

| Aspecto            | Scowlby original        | Nuestra versión                     |
|--------------------|-------------------------|-------------------------------------|
| Mascota            | Perro "Scowlby"         | **Bot de IA animado** ("Sparky"⚡ u otro nombre a definir) |
| Personalidad       | Gruñón pero adorable    | Curioso, brillante, algo travieso   |
| Animaciones        | Idle, parpadeo, cola    | Flotación (hover), ojos que siguen el cursor, antena pulsante, estados: idle / thinking / happy / error |
| Paleta             | Cremas + marrones cálidos | Cremas + índigo/violeta + acentos neón suaves (propuesta, ver §5) |
| Objetivo           | Landing plantilla       | Landing para un producto/agente de IA |

### El bot animado (pieza clave)
- **SVG + CSS keyframes** (idle float, blink, pulso de antena) — sin librerías pesadas.
- **Ojos que siguen al cursor** con un `requestAnimationFrame` ligero (~30 líneas JS).
- **Estados reactivos**: cambia de expresión según interacción (hover en CTA → "happy";
  sección de pricing visible → "thinking").
- Respeta `prefers-reduced-motion` (fallback estático).
- Opcional fase 2: Lottie o Rive si queremos más riqueza de animación.

---

## 2. Stack técnico

- **[Vite](https://vitejs.dev) + React 18 + TypeScript** — rápido, estándar, ideal para atomic design.
- **CSS Modules** (o Tailwind, decisión abierta — ver §7 Propuestas).
- **Framer Motion** para transiciones de scroll/secciones (opcional; el MVP usa CSS puro + IntersectionObserver).
- **ESLint + Prettier**, **Vitest** para tests de componentes atómicos.

## 3. Metodología: Spec-Kit (spec-driven development)

El proyecto está inicializado con [github/spec-kit](https://github.com/github/spec-kit)
(`.specify/`, scripts bash, templates de spec/plan/tasks ya instalados). Flujo de trabajo:

```text
/speckit-constitution  → principios del proyecto (calidad, a11y, rendimiento)
/speckit-specify       → qué construimos (esta landing + bot animado)
/speckit-clarify       → resolver ambigüedades (paleta, nombre, copy)
/speckit-plan          → stack, arquitectura atómica, structure
/speckit-tasks         → lista de tareas accionables
/speckit-implement     → ejecutar TDD por tarea
/speckit-converge      → auditar brechas y generar tareas restantes
```

## 4. Arquitectura: Atomic Design

Seguimos [bradfrost/atomic-design](https://github.com/bradfrost/atomic-design):

```text
src/
├── atoms/        # Botón, Icon, Heading, Text, Logo, Sparkle(dot), EyePart
├── molecules/    # NavItem+icon, FeatureCard(título+texto+icono), InputGroup,
│                 # BotFace (átomos faciales ensamblados = cara del bot)
├── organisms/    # Header/Nav, HeroBotSection, FeaturesGrid, ShowcaseGallery,
│                 # PricingTable, NewsletterForm, Footer
├── templates/    # LandingTemplate (slots: hero, features, showcase, cta, footer)
├── pages/        # HomePage
├── styles/       # tokens.css (design tokens), global.css
├── hooks/        # useCursorFollow, useInView, usePrefersReducedMotion
└── assets/       # svg/ (bot, formas decorativas), fonts/
```

**Design tokens** (`styles/tokens.css`): colores, escalas tipográficas, espaciado,
radios, sombras y duraciones de animación — fuente única de verdad del tema "cálido + tech".

### Secciones de la landing (espejo de la referencia)
1. **Header** sticky con logo + nav + CTA "Get started"
2. **Hero**: headline grande + subtítulo + CTA + **bot animado a la derecha** (protagonista)
3. **Marquee/logos** (banda deslizante opcional)
4. **Features**: grid de cards con iconos garabato
5. **Showcase/Galería**: capturas o ilustraciones con scroll horizontal
6. **Pricing** (tarjetas) — opcional según objetivo
7. **CTA final + Newsletter**
8. **Footer** con links sociales

## 5. Paleta propuesta (borrador)

```css
--color-cream:   #FFF6E9;  /* fondo principal (heredado del espíritu Scowlby) */
--color-ink:     #1F1B2E;  /* texto principal */
--color-indigo:  #5B4BFF;  /* primario CTAs, antena del bot */
--color-violet:  #9D7BFF;  /* secundario, brillos */
--color-mint:    #6EE7C7;  /* acento "IA feliz", éxitos */
--color-coral:   #FF7A5C;  /* acento cálido, notificaciones */
```

## 6. Calidad / requisitos no funcionales

- **Accesibilidad**: AA (contraste, foco visible, aria-labels, `prefers-reduced-motion`).
- **Rendimiento**: Lighthouse ≥ 95, bundle inicial < 120 KB gzip, SVG inline optimizado.
- **Responsive**: mobile-first, breakpoints 375 / 768 / 1024 / 1440.
- **SEO**: meta OG, sitemap simple, headings jerárquicos.

## 7. Próximos pasos

1. Revisar este README y decidir: **nombre del bot**, paleta definitiva y CSS Modules vs Tailwind.
2. Ejecutar `/speckit-constitution` y `/speckit-specify` con el alcance de arriba.
3. Scaffold Vite + React + TS y montar la estructura atómica.
4. Iteración 1: átomos + tokens + bot SVG estático → iteración 2: animaciones → iteración 3: secciones completas.

## Comandos (cuando exista el scaffold)

```bash
npm install
npm run dev      # desarrollo
npm run build    # producción
npm run preview  # previsualizar build
npm test         # Vitest
```
