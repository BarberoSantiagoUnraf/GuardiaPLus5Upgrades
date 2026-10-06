# ENTREGA — Laboratorio Guardia de Sigilo (Upgrades 5)

## Datos de entrega

- **Repositorio individual:** [URL del repositorio] _(completar en el box "Entrega"_)
- **Commit final:** [HASH del commit] _(completar tras hacer commit)_
- **Fecha de entrega límite:** martes 6 de octubre de 2026 a las 23:59

## Upgrades completados

1. **[02] Cono de visión visible y reactivo** — `docs/upgrades/01-cono-vision/`
   - `spec.md` | `plan.md` | `evidencia.md`
   - Cambios: `src/game/scenes/GameScene.ts` (borde + transición reactiva), `src/game/presentation/visionCone.ts`, `tests/presentation/visionCone.test.ts`
   - Criterios C1–C6 aprobados. `validate` OK.

2. **[04] Impacto visual extremo de alerta** — `docs/upgrades/02-impacto-visual/`
   - `spec.md` | `plan.md` | `evidencia.md`
   - Cambios: `src/game/presentation/alertFeedback.ts`, `tests/presentation/alertFeedback.test.ts`, `src/game/scenes/GameScene.ts` (shake + flash + zoom)
   - Criterios C1–C8 aprobados. Depuración con `resetFX()` documentada.

3. **[05] Cámara dinámica de tensión** — `docs/upgrades/03-camara-tension/`
   - `spec.md` | `plan.md` | `evidencia.md`
   - Cambios: `src/game/presentation/cameraTension.ts`, `tests/presentation/cameraTension.test.ts`, `src/game/scenes/GameScene.ts` (encuadre sostenido con gracia 500 ms)
   - Criterios C1–C7 aprobados.

4. **[07] Distractores sonoros interactivos** — `docs/upgrades/04-lure-sonoro/`
   - `spec.md` | `plan.md` | `evidencia.md`
   - Cambios: `src/game/presentation/soundLure.ts`, `tests/presentation/soundLure.test.ts`, `src/game/scenes/GameScene.ts` (tecla E, HUD, reset)
   - Criterios C1–C6 aprobados. Límite: README sin tecla E registrado.

5. **[10] Puertas, atajos o rutas bloqueables** — `docs/upgrades/05-puerta-atajo/`
   - `spec.md` | `plan.md` | `evidencia.md`
   - Cambios: `src/application/simulation/labLevel.ts` (`labMapWithDoor`, `DOOR_CELL`), `tests/application/labLevel.test.ts`, `src/game/scenes/GameScene.ts` (tecla F, mapa dinámico, marcador, HUD)
   - Criterios C1–C7 aprobados.

## Validación / Build

- Comando: `npm run validate`
- Resultado: **EXIT=0** (typecheck OK + 91 pruebas unitarias OK + build OK)
- Archivos de pruebas nuevos: `tests/presentation/visionCone.test.ts`, `tests/presentation/alertFeedback.test.ts`, `tests/presentation/cameraTension.test.ts`, `tests/presentation/soundLure.test.ts`, `tests/application/labLevel.test.ts`
- Tests totales: **91** (11 archivos) — todos aprobados

## Evidencia visual o telemetría

- Reproducción en ejecución (`npm run dev`) registrada por revisión visual en cada paquete (reposo→detección→retorno, shake/flash/zoom, ida/vuelta tensión, despliegue señuelo + marcador, apertura/cierre puerta + recalculo ruta).
- No se archivaron capturas en el repo (registrado como limitación en las evidencias); la trazabilidad queda en evidencia.md + git diff + comandos reproducibles.

## Limitaciones

- **Contraste**: C1–C2 del upgrade 01 dependen de revisión visual (no hay prueba automatizada de contraste).
- **Tiempo**: mediciones ≤300 ms / ≤500 ms / ≤1000 ms se validaron por lógica pura + observación visual (sin telemetría de runtime).
- **HUD oculto brevemente**: flash del upgrade 02 oculta HUD ~250 ms (aceptado; registrado).
- **Zoom fijo 0.85** (upgrade 03): puede no contener guardia+jugador si están muy separados (limitación aceptada).
- **Lure**: un solo evento sonoro vigente (reemplaza anterior); atraviesa paredes (coherente con `evaluateSound`); `README.md` no documenta tecla E (registrado).
- **Puerta**: una sola puerta `(19,7)`; mapa dinámico recrea grupo de paredes al alternar (ligero y funcional).
- **Dependencias**: `npm audit` reporta 4 vulnerabilidades (2 moderadas, 2 altas) preexistentes, no modificadas (fuera de alcance).
- **Build warning**: chunk JS > 500 kB preexistente (Phaser en un único chunk), no relacionado con upgrades.

## Verificación Git

- Estado: cambios locales en working tree (sin commit) — pendiente de tu autorización para commitear.
- Diff acotado: solo `src/application/simulation/labLevel.ts`, `src/game/scenes/GameScene.ts`, nuevos módulos en `src/game/presentation/`, nuevos tests y `docs/upgrades/*`.
- `src/domain/` **sin modificaciones** en todos los upgrades (verificado por `git status`/diff).

## Observaciones finales

Los 5 upgrades fueron desarrollados siguiendo el proceso: spec aprobada → plan aprobado → incrementos autorizados → validación tras cada incremento → cierre con matriz criterio-evidencia. Todos cumplen los criterios de aceptación. `npm run validate` finaliza correctamente (91 tests). La recomendación unánime de cada evidencia es **integrar**.
