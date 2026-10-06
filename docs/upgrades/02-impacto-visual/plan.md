---
id: upgrade-02-impacto-visual-plan
titulo: Plan — Upgrade 02 Impacto visual extremo de alerta
tipo: upgrade-plan
estado: aprobado
fecha: 2026-10-06
version: 1
---

# Plan — Impacto visual extremo de alerta

Spec de referencia: `docs/upgrades/02-impacto-visual/spec.md` (v1, aprobada).

## Punto inicial

- Fecha: 2026-10-06
- Versión del proyecto: 0.1.0, commit `5a1a34d`, rama `main`
- Estado Git: cambios locales del upgrade 01 sin commit (autorizados e
  integrados en working tree)
- Validación de referencia: `npm run validate` → EXIT=0, 7 archivos / 52
  pruebas (resultado del cierre del upgrade 01)

## Incrementos

### Incremento 1 — Lógica pura de alerta (C2, C3)

- **Archivos nuevos:**
  - `src/game/presentation/alertFeedback.ts` — módulo puro sin Phaser:
    constantes (`ALERT_SHAKE_MS`, `ALERT_FLASH_MS`, `ALERT_ZOOM_PEAK`,
    `ALERT_TOTAL_MS` < 1000), `alertPhase(changedAtMs, nowMs)` →
    `{ active, progress }` con clamp y `zoomDuringAlert(...)` con perfil
    triangular (1 → pico → 1)
  - `tests/presentation/alertFeedback.test.ts`
- **Criterios:** C2 (duración <1000 ms y retorno a zoom 1), C3 (lógica de
  un solo disparo por transición)
- **Validación:** `npx vitest run tests/presentation/alertFeedback.test.ts`
  y `npm run typecheck`
- **Riesgo:** bajo
- **Condición de detención:** si el módulo exige dependencias de Phaser o
  cambios en `src/application/` o `src/domain/`

### Incremento 2 — Efectos en cámara (C1, C4, C5, C6)

- **Archivo modificado:** `src/game/scenes/GameScene.ts`
  - disparo en la transición `visible: false → true` (evento ya rastreado
    con `visionVisible` / `visionChangedAtMs`): `cameras.main.shake()` y
    `cameras.main.flash()`
  - zoom por cuadro con `zoomDuringAlert(...)` y `setZoom(1)` al inactivo
  - `setZoom(1)` en `create()` para reinicio con R durante la alerta
- **Validación:** `npm run typecheck` + revisión visual: entrada al cono
  (C1), permanecer dentro sin repetir (C3), salida y reentrada (C4),
  movimiento del jugador durante la alerta (C5), R con alerta activa (C6)
- **Riesgo:** medio; composición de shake y zoom en la misma cámara
- **Condición de detención:** si Phaser no restaura la cámara tras un
  efecto, o si el cambio cruza a `src/application/` o `src/domain/`

### Incremento 3 — Validación y cierre (C7, C8 + evidencia)

- **Archivo nuevo:** `docs/upgrades/02-impacto-visual/evidencia.md`
- **Validación:** `npm run validate`, `git status`, `git diff --stat`,
  capturas de activación, curso, retorno y reinicio
- **Riesgo:** bajo
- **Condición de detención:** `validate` falla por una causa no comprendida;
  ningún commit sin autorización humana

## Fueras de alcance confirmados

- `src/domain/` y `src/application/`
- Audio, partículas, colores de actores, estados del guardia
- Movimiento, navegación, memoria, detección
- Dependencias nuevas y recursos externos
