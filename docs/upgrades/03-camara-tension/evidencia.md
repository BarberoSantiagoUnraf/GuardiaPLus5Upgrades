---
id: upgrade-03-camara-tension-evidencia
titulo: Evidencia — Upgrade 05 Cámara dinámica de tensión
tipo: upgrade-evidencia
estado: completado
fecha: 2026-10-06
version: 1
---

# Evidencia — Cámara dinámica de tensión

## Versiones

| | Valor |
|---|---|
| Versión inicial del proyecto | 0.1.0, commit `5a1a34d`, rama `main`, con upgrades 01 y 02 en working tree |
| Validación de referencia | `npm run validate` → EXIT=0, 8 archivos / 63 pruebas (cierre upgrade 02) |
| Versión final del proyecto | 0.1.0, upgrades 01–03 en working tree (sin commit, pendientes de autorización) |
| Entorno | Windows, Node v22.18.0, npm 10.8.2, `node_modules` de `npm ci` |
| Cambios preexistentes | upgrades 01 y 02 aprobados e integrados en working tree |

## Registro cronológico resumido

1. Spec redactada y **aprobada por la persona estudiante** (v1), con
   ambigüedades declaradas (encuadre base, zoom fijo 0.85, composición con
   el upgrade 02).
2. Plan por incrementos redactado y **aprobado**.
3. Incremento 1 (lógica pura del encuadre): `cameraTension.ts` + 16
   pruebas; durante la escritura se corrigió la máquina para consumir el
   `delta` al entrar en la gracia y al reanudar la ida (los tests
   intermediarios detectaron el desfase de tiempos) → typecheck EXIT=0,
   16/16; **aprobado**.
4. Incremento 2 (integración en escena): verificación previa en fuente de
   Phaser (`Camera.js:598` — el shake es translate de render y no muta
   `scrollX/scrollY`, por lo que compone con `setScroll`) → typecheck
   EXIT=0, 40/40 pruebas de presentación; **C1–C4 y C6 aprobadas** por la
   persona estudiante tras revisión visual.
5. Incremento 3: `npm run validate` final → EXIT=0, 9 archivos / 79
   pruebas, build OK.

Iteraciones: 3 incrementos, 0 fallos de build, 1 ajuste de diseño detectado
por tests antes de la integración.

## Comandos y resultados

| Comando | Resultado | Código de salida |
|---|---|---|
| `npm run typecheck` (tras incremento 1) | sin errores | 0 |
| `npx vitest run tests/presentation/cameraTension.test.ts` | 16 pruebas OK | 0 |
| `npm run typecheck` (tras incremento 2) | sin errores | 0 |
| `npx vitest run tests/presentation/` | 40 pruebas OK (13 + 11 + 16) | 0 |
| `npm run validate` (final) | typecheck OK; 79 pruebas en 9 archivos OK; build OK | 0 |

## Diferencias (diff)

- Modificado: `src/game/scenes/GameScene.ts` — 75 inserciones, 3
  eliminaciones en total (acumulado de los upgrades 01–03 sobre el commit
  inicial; este upgrade aporta la integración de `updateCamera`, el estado
  de tensión y el restaurado en `create()`)
- Nuevo: `src/game/presentation/cameraTension.ts` (puro, sin Phaser)
- Nuevo: `tests/presentation/cameraTension.test.ts` (16 pruebas)
- Nuevos documentales: `docs/upgrades/03-camara-tension/{spec,plan,evidencia}.md`
- `git status`: sin cambios en `src/domain/`, `src/application/`,
  `package.json` ni `package-lock.json`

## Matriz criterio → comprobación → resultado

| Criterio | Comprobación | Resultado |
|---|---|---|
| C1 Convergencia ≤500 ms al encuadre de tensión | Prueba unitaria: `advanceTension` con delta 500 → progreso ≥0.95 y fase `holding`; revisión visual | Cumple — aprobado |
| C2 Vuelta ≤1000 ms tras 500 ms de gracia | Prueba unitaria: gracia 500 → `returning`; +1000 → `base` progreso 0; revisión visual de salida del cono | Cumple — aprobado |
| C3 Transiciones interpoladas sin saltos | Prueba unitaria de progreso lineal y reanudación desde la posición actual; revisión visual de ida y vuelta | Cumple — aprobado |
| C4 Sin zoom residual tras la alerta del 02 | `updateCamera`: prioridad a `alertPhase.active`; al expirar aplica `tensionZoom(progress)`; revisión visual de detección → fin de alerta → tensión | Cumple — aprobado |
| C5 `src/domain/` y `src/application/` sin cambios | `git status` / `git diff --stat` | Cumple |
| C6 Control y HUD durante la tensión | Revisión visual: mover al jugador con tensión activa | Cumple — aprobado |
| C7 `npm run validate` correcto | Ejecución final con código de salida | Cumple (EXIT=0) |

## Limitaciones

- C1–C4 y C6 se apoyan en revisión visual humana; no hay capturas
  archivadas ni telemetría de cámara en runtime.
- Zoom de tensión fijo en 0.85: si el guardia y el jugador están muy
  separados, el encuadre puede no contenerlos a los dos (limitación
  aceptada en la spec).
- El encuadre base es fijo (`scroll 0,0`, `zoom 1`) — la cámara de reposo
  no sigue al jugador, por diseño y fuera de alcance.
- Advertencia preexistente de build (chunk > 500 kB) persiste; no relacionada.
- Sin commits: cambios en working tree, pendientes de autorización humana.

## Decisión humana

- Spec aprobada: sí (2026-10-06).
- Plan aprobado: sí.
- C1–C7 revisadas y aprobadas: sí.
- **Recomendación del agente: integrar.** Decisión final (integrar /
  corregir / revertir / descartar) pendiente de registro por la persona
  estudiante.
