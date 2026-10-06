---
id: upgrade-04-lure-sonoro-plan
titulo: Plan — Upgrade 07 Distractores sonoros interactivos
tipo: upgrade-plan
estado: aprobado
fecha: 2026-10-06
version: 1
---

# Plan — Distractores sonoros interactivos

Spec de referencia: `docs/upgrades/04-lure-sonoro/spec.md` (v1, aprobada).

## Punto inicial

- Fecha: 2026-10-06
- Versión del proyecto: 0.1.0, commit `5a1a34d`, rama `main`
- Estado Git: upgrades 01–03 en working tree (aprobados, sin commit)
- Validación de referencia: `npm run validate` → EXIT=0, 9 archivos / 79
  pruebas (cierre del upgrade 03)

## Incrementos

### Incremento 1 — Lógica pura de recursos y lanzamiento (C1, C2, C4)

- **Archivos nuevos:**
  - `src/game/presentation/soundLure.ts` — puro, sin Phaser: constantes
    (`LURE_MAX_CHARGES = 3`, `LURE_COOLDOWN_MS = 5000`, `LURE_RANGE = 160`,
    `LURE_RADIUS = 260`, `LURE_DURATION_MS = 1200`), `initialLureState()`,
    `lureCooldownRemainingMs()`, `canDeploy()`,
    `deployLure(state, origin, pointer, nowMs)` (devuelve posición con
    clamp de alcance o el motivo del bloqueo) y `lureStatus()` para el HUD
  - `tests/presentation/soundLure.test.ts`
- **Criterios:** C1 (consumo exacto y bloqueo), C2 (posición ≤160 px en la
  dirección del puntero), C4 (3 cargas, enfriamiento 5000 ms)
- **Validación:** `npx vitest run tests/presentation/soundLure.test.ts`
  y `npm run typecheck`
- **Riesgo:** bajo
- **Condición de detención:** si el módulo necesita Phaser o cambios en
  `src/application/` o `src/domain/`

### Incremento 2 — Integración en la escena (C3, C4 visual)

- **Archivo modificado:** `src/game/scenes/GameScene.ts`
  - tecla `E` en `update()`: `deployLure` con posición del jugador y del
    puntero; si despliega, `withSoundEvent` con `radius`/`durationMs` de la
    spec
  - texto de HUD con cargas y enfriamiento (junto al HUD existente)
  - restauración en `create()`: `initialLureState()` y evento sonoro limpio
- **Validación:** `npm run typecheck` + revisión visual: despliegue y
  consumo (C1), posición del señuelo (C2), escucha con marcador rojo y
  HUD `sonido OIDO` (C3), bloqueo sin cargas/enfriamiento y `R` (C4)
- **Riesgo:** bajo; la escucha y la memoria ya funcionan sin cambios
- **Condición de detención:** si el efecto requiere tocar
  `perceptionSimulation` o `evaluateSound`

### Incremento 3 — Validación y cierre (C5, C6 + evidencia)

- **Archivo nuevo:** `docs/upgrades/04-lure-sonoro/evidencia.md`
- **Validación:** `npm run validate`, `git status`, `git diff --stat`,
  capturas de despliegue, escucha, bloqueo y reinicio
- **Riesgo:** bajo
- **Condición de detención:** `validate` falla por causa no comprendida;
  ningún commit sin autorización humana

## Fueras de alcance confirmados

- `src/domain/` y `src/application/` (incluye `evaluateSound` y `memory`)
- Desvío físico del guardia (sin estados), múltiples eventos simultáneos
- Audio con recursos externos, dependencias nuevas
