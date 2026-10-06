---
id: upgrade-03-camara-tension-plan
titulo: Plan — Upgrade 05 Cámara dinámica de tensión
tipo: upgrade-plan
estado: aprobado
fecha: 2026-10-06
version: 1
---

# Plan — Cámara dinámica de tensión

Spec de referencia: `docs/upgrades/03-camara-tension/spec.md` (v1, aprobada).

## Punto inicial

- Fecha: 2026-10-06
- Versión del proyecto: 0.1.0, commit `5a1a34d`, rama `main`
- Estado Git: upgrades 01 y 02 en working tree (aprobados, sin commit)
- Validación de referencia: `npm run validate` → EXIT=0, 8 archivos / 63
  pruebas (cierre del upgrade 02)

## Incrementos

### Incremento 1 — Lógica pura del encuadre (C1, C2, C3)

- **Archivos nuevos:**
  - `src/game/presentation/cameraTension.ts` — puro, sin Phaser:
    constantes `TENSION_ZOOM = 0.85`, `TENSION_IN_MS = 500`,
    `TENSION_RETURN_DELAY_MS = 500`, `TENSION_RETURN_MS = 1000`;
    máquina de fases `base → entering → holding → grace → returning → base`
    avanzada con `advanceTension(state, visible, deltaMs)`;
    `tensionZoom(progress)` (1 → 0.85) y
    `tensionScroll(base, guard, player, progress)` (centrada interpolada)
  - `tests/presentation/cameraTension.test.ts`
- **Criterios:** C1 (convergencia ≤500 ms, progreso ≥0.95), C2 (vuelta
  ≤1000 ms tras 500 ms de gracia), C3 (progreso continuo 0→1 sin saltos)
- **Validación:** `npx vitest run tests/presentation/cameraTension.test.ts`
  y `npm run typecheck`
- **Riesgo:** bajo
- **Condición de detención:** si el módulo necesita Phaser o cambios en
  `src/application/` o `src/domain/`

### Incremento 2 — Integración en la escena (C4, C6)

- **Archivo modificado:** `src/game/scenes/GameScene.ts`
  - estado de tensión avanzado en `update()` con `delta` y `vision.visible`
  - `setScroll`/`setZoom` por cuadro, con prioridad del zoom de alerta
    (upgrade 02) mientras `alertPhase.active`
  - encuadre base registrado en `create()`; restauración en `create()` para
    el reinicio con R
- **Validación:** `npm run typecheck` + revisión visual: ida (C1), sostén,
  gracia de 500 ms y vuelta (C2), continuidad (C3), alerta superpuesta
  (C4), control y HUD durante tensión (C6), R durante tensión
- **Riesgo:** medio; composición con shake/flash/zoom del upgrade 02
- **Condición de detención:** si la composición con el upgrade 02 produce
  zoom o scroll residual, o si el cambio cruza a `application/` o `domain/`

### Incremento 3 — Validación y cierre (C5, C7 + evidencia)

- **Archivo nuevo:** `docs/upgrades/03-camara-tension/evidencia.md`
- **Validación:** `npm run validate`, `git status`, `git diff --stat`,
  capturas de ida, tensión sostenida, vuelta y reinicio
- **Riesgo:** bajo
- **Condición de detención:** `validate` falla por causa no comprendida;
  ningún commit sin autorización humana

## Fueras de alcance confirmados

- `src/domain/` y `src/application/`
- Follow del jugador fuera de tensión, audio, partículas, estados, HUD
- Dependencias nuevas y recursos externos
