---
id: upgrade-01-cono-vision-evidencia
titulo: Evidencia — Upgrade 01 Cono de visión visible y reactivo
tipo: upgrade-evidencia
estado: completado
fecha: 2026-10-06
version: 1
---

# Evidencia — Cono de visión visible y reactivo

## Versiones

| | Valor |
|---|---|
| Versión inicial del proyecto | 0.1.0, commit `5a1a34d` (Initial commit), rama `main` |
| Estado Git inicial | limpio, salvo archivos sin seguimiento preexistentes (`Promps.md`) |
| Versión final del proyecto | 0.1.0, mismos cambios locales de esta sesión (sin commit, pendiente de autorización) |
| Entorno | Windows, Node v22.18.0, npm 10.8.2, `node_modules` instalado con `npm ci` en esta sesión |
| Cambios preexistentes | ninguno en `src/`; `package.json` y `package-lock.json` sin diferencias |

## Registro cronológico resumido

1. Exploración en lectura de README, AGENTS, specs, arquitectura, código y pruebas.
2. Selección humana de upgrades: 2, 4, 5, 7 y 10 (sin máquina de estados).
3. Spec redactada y **aprobada por la persona estudiante** (v1).
4. Plan por incrementos redactado y **aprobado**.
5. `npm ci` **autorizado** previamente por la persona estudiante.
6. Validación de referencia (punto inicial): `npm run validate` → EXIT=0, 6 archivos / 39 pruebas.
7. Incremento 1 (borde del cono) → typecheck EXIT=0; diff +2 líneas; **C1 aprobada visualmente por la persona estudiante**.
8. Incremento 2 (estado reactivo ≤300 ms) → typecheck EXIT=0, 13 pruebas nuevas; **C2 y C3 aprobadas por la persona estudiante**.
9. Incremento 3 (validación y cierre): `npm run validate` final → EXIT=0, 7 archivos / 52 pruebas, build OK.

Iteraciones: 3 incrementos, 1 revisión por incremento, sin depuración necesaria (ningún fallo observado).

## Comandos y resultados

| Comando | Resultado | Código de salida |
|---|---|---|
| `npm ci` | 47 paquetes instalados; 4 vulnerabilities reportadas por npm (preexistentes, ver limitaciones) | 0 |
| `npm run validate` (referencia inicial) | typecheck OK; 39 pruebas en 6 archivos OK; build OK | 0 |
| `npm run typecheck` (tras incremento 1) | sin errores | 0 |
| `npm run typecheck` (tras incremento 2) | sin errores | 0 |
| `npx vitest run tests/presentation/visionCone.test.ts` | 13 pruebas en 1 archivo OK | 0 |
| `npm run validate` (final) | typecheck OK; 52 pruebas en 7 archivos OK; build OK (`dist/` generado) | 0 |

Advertencia observada en build (preexistente, no introducida por este upgrade): chunk JS > 500 kB
(`index-7aGgv4Tn.js`, 1.498 kB) — propio de Phaser incluido en un único chunk.

## Diferencias (diff)

- Modificado: `src/game/scenes/GameScene.ts` — 24 inserciones, 3 eliminaciones.
  - import de `visionConeAppearance`
  - campos `visionVisible` / `visionPreviousVisible` / `visionChangedAtMs` (reset en `create`)
  - detección de cambio de estado en `updatePerception`
  - `drawPerception(timeMs)` usa la apariencia calculada y agrega `lineStyle` + `strokePath`
- Nuevo: `src/game/presentation/visionCone.ts` (módulo puro, sin Phaser)
- Nuevo: `tests/presentation/visionCone.test.ts` (13 pruebas)
- Nuevos documentales: `docs/upgrades/01-cono-vision/{spec,plan,evidencia}.md`
- `git diff --stat`: 1 archivo rastreado modificado, +24/−3; el resto sin seguimiento
- `src/domain/` y `src/application/` sin cambios (verificable con `git status`)

## Matriz criterio → comprobación → resultado

| Criterio | Comprobación | Resultado |
|---|---|---|
| C1 Borde visible diferenciable del relleno | Revisión visual en `npm run dev` por la persona estudiante | Cumple — aprobado el 2026-10-06 |
| C2 Color sincronizado con `VisionResult.visible` | Revisión visual contrapuesta con HUD (`vision VISIBLE`) + `visionConeAppearance` prueba unidad | Cumple — aprobado el 2026-10-06 |
| C3 Retorno a reposo en <300 ms | Prueba unitaria: en `changedAt + VISION_CONE_TRANSITION_MS` el color es el de reposo; revisión visual | Cumple — aprobado el 2026-10-06 |
| C4 Geometría sin cambios | Diff: sin modificaciones a `guardFacing`, `VISION_RANGE`, `FIELD_OF_VIEW` ni `evaluateVision` | Cumple |
| C5 `src/domain/` sin modificaciones | `git status` sin cambios en `src/domain/` | Cumple |
| C6 `npm run validate` correcto | Ejecución final con código de salida | Cumple (EXIT=0) |

## Limitaciones

- C1 y C2 dependen de revisión visual humana; no existe prueba automatizada de
  contraste ni captura archivada en el repositorio.
- La medición de 300 ms se comprueba por prueba unitaria de la lógica pura y
  observación en pantalla, no por telemetría de cuadros en runtime.
- `npm audit` reporta 4 vulnerabilities (2 moderadas, 2 altas) en dependencias
  de desarrollo; no se modificó `package-lock.json` por quedar fuera de alcance.
- No se creó ningún commit: el cambio vive en working tree, pendiente de
  autorización humana.

## Decisión humana

- Spec aprobada: sí (persona estudiante, 2026-10-06).
- Plan aprobado: sí.
- Autorización de `npm ci`: sí.
- C1, C2, C3 aprobadas tras revisión: sí.
- **Recomendación del agente: integrar.** Decisión final (integrar / corregir /
  revertir / descartar) pendiente de registro por la persona estudiante.
