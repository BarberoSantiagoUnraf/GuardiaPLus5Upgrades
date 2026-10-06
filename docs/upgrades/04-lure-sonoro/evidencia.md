---
id: upgrade-04-lure-sonoro-evidencia
titulo: Evidencia — Upgrade 07 Distractores sonoros interactivos
tipo: upgrade-evidencia
estado: completado
fecha: 2026-10-06
version: 1
---

# Evidencia — Distractores sonoros interactivos

## Versiones

| | Valor |
|---|---|
| Versión inicial del proyecto | 0.1.0, commit `5a1a34d`, rama `main`, con upgrades 01–03 en working tree |
| Validación de referencia | `npm run validate` → EXIT=0, 9 archivos / 79 pruebas (cierre upgrade 03) |
| Versión final del proyecto | 0.1.0, upgrades 01–04 en working tree (sin commit, pendientes de autorización) |
| Entorno | Windows, Node v22.18.0, npm 10.8.2, `node_modules` de `npm ci` |
| Cambios preexistentes | upgrades 01–03 aprobados e integrados en working tree |

## Registro cronológico resumido

1. Spec redactada y **aprobada por la persona estudiante** (v1), con
   ambigüedades declaradas (alcance sin colisión con paredes, semántica
   respecto de `Q`, formato del HUD, tecla `E` sin conflicto).
2. Plan por incrementos redactado y **aprobado**.
3. Incremento 1 (lógica pura de recursos y lanzamiento): `soundLure.ts` +
   9 pruebas → typecheck EXIT=0, 9/9; **aprobado**.
4. Incremento 2 (integración en escena): tecla `E`, evento `SoundEvent`,
   HUD `SENUELOS` → typecheck EXIT=0, 49/49 pruebas de presentación;
   **C1–C4 aprobadas** por la persona estudiante tras revisión visual.
5. Incremento 3: `npm run validate` final → EXIT=0, 10 archivos / 88
   pruebas, build OK.

Iteraciones: 3 incrementos, 0 fallos, 0 depuraciones.

## Comandos y resultados

| Comando | Resultado | Código de salida |
|---|---|---|
| `npm run typecheck` (tras incremento 1) | sin errores | 0 |
| `npx vitest run tests/presentation/soundLure.test.ts` | 9 pruebas OK | 0 |
| `npm run typecheck` (tras incremento 2) | sin errores | 0 |
| `npx vitest run tests/presentation/` | 49 pruebas OK (13 + 11 + 16 + 9) | 0 |
| `npm run validate` (final) | typecheck OK; 88 pruebas en 10 archivos OK; build OK | 0 |

## Diferencias (diff)

- Modificado: `src/game/scenes/GameScene.ts` — 128 inserciones, 3
  eliminaciones acumuladas sobre el commit inicial; este upgrade aporta la
  tecla `E`, el despliegue con `deployLure`, el evento de señuelo, el texto
  `lureHud` y su actualización/reinicio
- Nuevo: `src/game/presentation/soundLure.ts` (puro, sin Phaser)
- Nuevo: `tests/presentation/soundLure.test.ts` (9 pruebas)
- Nuevos documentales: `docs/upgrades/04-lure-sonoro/{spec,plan,evidencia}.md`
- `git status`: sin cambios en `src/domain/`, `src/application/`,
  `package.json` ni `package-lock.json`

## Matriz criterio → comprobación → resultado

| Criterio | Comprobación | Resultado |
|---|---|---|
| C1 `E` sólo emite con cargas y sin enfriamiento; consume exactamente una carga | Prueba unitaria (`deployLure` devuelve `no-charges`/`cooldown` y descuenta 1) + revisión visual del HUD | Cumple — aprobado |
| C2 Señuelo en la dirección del puntero a ≤160 px | Prueba unitaria de `lurePosition` (clamp exacto en rango y en rango corto) + revisión visual | Cumple — aprobado |
| C3 Escucha con `sonido OIDO` y `lastKnownPosition` = señuelo | Revisión visual: marcador rojo se desplaza al señuelo y HUD cambia (mecanismo de dominio sin modificar: `evaluateSound` + `rememberObservation`) | Cumple — aprobado |
| C4 3 cargas, enfriamiento 5000 ms, `R` restaura | Prueba unitaria (cooldown 5000 ms exacto, cargas 3→2) + revisión visual de reinicio con `R` | Cumple — aprobado |
| C5 `src/domain/` y `src/application/` sin cambios | `git status` / `git diff --stat` | Cumple |
| C6 `npm run validate` correcto | Ejecución final con código de salida | Cumple (EXIT=0) |

## Limitaciones

- El guardia **no** se desvía físicamente hacia el sonido (no existe
  máquina de estados); la distracción se manifiesta por memoria, marcador y
  HUD. Con estados futuros el señuelo ganaría la desvío real.
- Un solo evento sonoro vigente: un nuevo despliegue (o un `Q`) reemplaza
  al anterior, incluida su posición.
- El señuelo puede colocarse atravesando paredes (decisión de diseño:
  el sonido ya atraviesa paredes en `evaluateSound`).
- El `README.md` documenta los controles (`WASD`, `Q`, `R`, `ESPACIO`,
  clic) y **no** incluye la nueva tecla `E`: actualizarlo quedó fuera del
  alcance acotado a `src/game/` + paquete; se recomienda hacerlo antes de
  la entrega final.
- C1–C4 se apoyan en revisión visual humana además de las pruebas
  unitarias; no hay capturas archivadas.
- Advertencia preexistente de build (chunk > 500 kB) persiste; no relacionada.
- Sin commits: cambios en working tree, pendientes de autorización humana.

## Decisión humana

- Spec aprobada: sí (2026-10-06).
- Plan aprobado: sí.
- C1–C6 revisadas y aprobadas: sí.
- **Recomendación del agente: integrar.** Decisión final (integrar /
  corregir / revertir / descartar) pendiente de registro por la persona
  estudiante.
