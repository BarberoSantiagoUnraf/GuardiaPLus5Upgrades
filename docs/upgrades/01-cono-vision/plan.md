---
id: upgrade-01-cono-vision-plan
titulo: Plan — Upgrade 01 Cono de visión visible y reactivo
tipo: upgrade-plan
estado: aprobado
fecha: 2026-10-06
version: 1
---

# Plan — Cono de visión visible y reactivo

Spec de referencia: `docs/upgrades/01-cono-vision/spec.md` (v1, aprobada).

## Punto inicial

- Fecha: 2026-10-06
- Versión del proyecto: 0.1.0 (`package.json`)
- Rama y estado de Git: registrar con `git status --short --branch` al ejecutar
- Validación de referencia: `npm run validate` (registrar código de salida)

## Incrementos

### Incremento 1 — Borde del cono (C1, C4, C5)

- **Archivos previstos:** `src/game/scenes/GameScene.ts` (sólo `drawPerception`)
- **Cambio:** tras `fillPath()`, repetir el trazado del cono con
  `lineStyle(2, colorPropio, 1)` y `strokePath()`; contorno del arco y dos radios
- **Criterio:** C1 (borde visible diferenciable del relleno)
- **Validación:** `npm run typecheck` + revisión visual (`npm run dev`)
- **Riesgo:** bajo; mismo patrón de `Graphics` ya usado en el trazado de ruta
- **Condición de detención:** si el cambio exige modificar `src/domain/` o
  `src/application/`, detenerse y consultar

### Incremento 2 — Estado reactivo con transición ≤300 ms (C2, C3)

- **Archivos nuevos:**
  - `src/game/presentation/visionCone.ts` — módulo puro sin Phaser:
    constantes de color, `VISION_CONE_TRANSITION_MS = 300` y
    `visionConeAppearance(visible, changedAtMs, nowMs) → { fill, alpha }`
  - `tests/presentation/visionCone.test.ts` — progreso 0→1, límites
    (clamps) y distinción de colores reposo/detección
- **Archivos modificados:** `src/game/scenes/GameScene.ts` — registrar
  `visionChangedAtMs` cuando cambia `vision.visible`, pasar `time` al dibujo
- **Criterios:** C2 (sincronía con `VisionResult.visible`), C3 (retorno en
  menos de 300 ms)
- **Validación:** `npx vitest run tests/presentation/visionCone.test.ts`,
  `npm run typecheck`, revisión visual contrapuesta con el HUD
- **Riesgo:** medio; contraste de colores y medición visual de 300 ms
- **Condición de detención:** si el cambio cruza a `src/application/` o
  `src/domain/`, detenerse y consultar

### Incremento 3 — Validación y cierre (C6 + evidencia)

- **Archivos nuevos:** `docs/upgrades/01-cono-vision/evidencia.md`
- **Contenido:** versión inicial/final, comandos y resultados, diff,
  matriz criterio→comprobación→resultado, limitaciones y decisión humana
- **Validación:** `npm run validate`, `git status`, `git diff --stat`
  y capturas reposo→detección→retorno
- **Riesgo:** bajo
- **Condición de detención:** `validate` falla por una causa no comprendida;
  ningún commit sin autorización humana

## Fueras de alcance confirmados

- `src/domain/perception/` y cualquier símbolo de detección
- Navegación, movimiento, memoria, sonido
- Estados del guardia, audio, partículas, shake o cámara
- Dependencias nuevas y recursos externos
