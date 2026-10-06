---
id: upgrade-02-impacto-visual-evidencia
titulo: Evidencia — Upgrade 02 Impacto visual extremo de alerta
tipo: upgrade-evidencia
estado: completado
fecha: 2026-10-06
version: 1
---

# Evidencia — Impacto visual extremo de alerta

## Versiones

| | Valor |
|---|---|
| Versión inicial del proyecto | 0.1.0, commit `5a1a34d`, rama `main`, con cambios locales del upgrade 01 en working tree |
| Validación de referencia | `npm run validate` → EXIT=0, 7 archivos / 52 pruebas (cierre upgrade 01) |
| Versión final del proyecto | 0.1.0, mismos cambios locales (upgrades 01 y 02 sin commit, pendientes de autorización) |
| Entorno | Windows, Node v22.18.0, npm 10.8.2, `node_modules` de `npm ci` (sesión anterior) |
| Cambios preexistentes | upgrade 01 aprobado e integrado en working tree; sin cambios ajenos en `src/` |

## Registro cronológico resumido

1. Spec redactada y **aprobada por la persona estudiante** (v1).
2. Plan por incrementos redactado y **aprobado**.
3. Incremento 1 (lógica pura de alerta): `alertFeedback.ts` + 11 pruebas →
   typecheck EXIT=0, pruebas EXIT=0; **aprobado**.
4. Incremento 2 (efectos en cámara): fallo de tipos (ver depuración) →
   corrección → typecheck EXIT=0, 24 pruebas de presentación EXIT=0;
   **C1, C3, C4, C5 y C6 aprobadas** por la persona estudiante tras
   revisión visual, aceptando el parpadeo del flash.
5. Incremento 3: `npm run validate` final → EXIT=0, 8 archivos / 63 pruebas,
   build OK.

Iteraciones: 3 incrementos, 1 depuración (error de tipos), sin retrasos.

## Comandos y resultados

| Comando | Resultado | Código de salida |
|---|---|---|
| `npm run typecheck` (tras incremento 1) | sin errores | 0 |
| `npx vitest run tests/presentation/alertFeedback.test.ts` | 11 pruebas OK | 0 |
| `npm run typecheck` (tras incremento 2, primera pasada) | **fallo**: TS2339 `stopShake`/`stopFlash` inexistentes | 2 |
| `npm run typecheck` (tras corrección) | sin errores | 0 |
| `npx vitest run tests/presentation/` | 24 pruebas OK (11 + 13) | 0 |
| `npm run validate` (final) | typecheck OK; 63 pruebas en 8 archivos OK; build OK | 0 |

## Depuración (reproducción → hipótesis → corrección)

- **Reproducción:** `npm run typecheck` tras agregar reset de cámara en `create()`.
- **Hipótesis:** la API de Phaser 3.90 no expone `stopShake`/`stopFlash` en `Camera`.
- **Verificación:** búsqueda en `node_modules/phaser/types/phaser.d.ts`:
  `shake` (:3579), `flash` (:3568) existen; el método de reset es
  `resetFX()` (:3682).
- **Corrección mínima:** reemplazar las dos llamadas por `resetFX()` en
  `GameScene.create()`. Repetido typecheck → EXIT=0. Causa raíz resuelta,
  sin cambios de diseño.

## Diferencias (diff)

- Modificado: `src/game/scenes/GameScene.ts` — 54 inserciones, 3
  eliminaciones (incluye el incremento 1 del upgrade 01 registrado antes de
  su cierre; el upgrade 01 aportó +24/−3 de ese total).
- Nuevo: `src/game/presentation/alertFeedback.ts` (puro, sin Phaser)
- Nuevo: `tests/presentation/alertFeedback.test.ts` (11 pruebas)
- Nuevos documentales: `docs/upgrades/02-impacto-visual/{spec,plan,evidencia}.md`
- `git status`: sin cambios en `src/domain/`, `src/application/`,
  `package.json` ni `package-lock.json`

## Matriz criterio → comprobación → resultado

| Criterio | Comprobación | Resultado |
|---|---|---|
| C1 Efecto exacto en transición `false → true` | Revisión visual contrapuesta con HUD por la persona estudiante | Cumple — aprobado |
| C2 Duración <1000 ms y retorno a reposo | Prueba unitaria `ALERT_TOTAL_MS < 1000` y zoom vuelve a 1; revisión visual | Cumple — aprobado |
| C3 Sin re-disparo mientras `visible` es `true` | Prueba unitaria de fase + revisión visual permaneciendo en el cono | Cumple — aprobado |
| C4 Nueva transición re-dispara | Revisión visual: salir y volver a entrar al cono | Cumple — aprobado |
| C5 Control activo y HUD legible | Revisión visual moviendo al jugador durante la alerta | Cumple con limitación: el flash blanco oculta el HUD ~250 ms (aceptado por la persona estudiante) |
| C6 Reinicio con R deja la cámara en reposo | `create()` ejecuta `resetFX()` + `setZoom(1)`; revisión visual con R durante la alerta | Cumple — aprobado |
| C7 `src/domain/` y `src/application/` sin cambios | `git status` / `git diff --stat` | Cumple |
| C8 `npm run validate` correcto | Ejecución final con código de salida | Cumple (EXIT=0) |

## Limitaciones

- C1, C3, C4, C5 y C6 se apoyan en revisión visual humana; no hay capturas
  archivadas ni telemetría de cámara en runtime.
- C5: el flash de cámara cubre el HUD durante ~250 ms; alternativa no
  implementada (overlay bajo el HUD) queda como mejora posible.
- `ALERT_SHAKE_INTENSITY = 0.01` y `ALERT_ZOOM_PEAK = 0.06` son valores de
  ajuste elegidos sin criterio de accesibilidad (p. ej. sensibilidad al
  movimiento); si molesta, se reducen en una constante.
- Advertencia preexistente de build (chunk > 500 kB) persiste; no relacionada.
- Sin commits: cambios en working tree, pendientes de autorización humana.

## Decisión humana

- Spec aprobada: sí (2026-10-06).
- Plan aprobado: sí.
- C1–C8 revisadas y aprobadas: sí (con la limitación de C5 registrada).
- **Recomendación del agente: integrar.** Decisión final (integrar /
  corregir / revertir / descartar) pendiente de registro por la persona
  estudiante.
