---
id: upgrade-05-puerta-atajo-evidencia
titulo: Evidencia — Upgrade 10 Puertas, atajos o rutas bloqueables
tipo: upgrade-evidencia
estado: completado
fecha: 2026-10-06
version: 1
---

# Evidencia — Puertas, atajos o rutas bloqueables

## Versiones

| | Valor |
|---|---|
| Versión inicial del proyecto | 0.1.0, commit `5a1a34d`, rama `main`, con upgrades 01–04 en working tree |
| Validación de referencia | `npm run validate` → EXIT=0, 10 archivos / 88 pruebas (cierre upgrade 04) |
| Versión final del proyecto | 0.1.0, upgrades 01–05 en working tree (sin commit, pendientes de autorización) |
| Entorno | Windows, Node v22.18.0, npm 10.8.2, `node_modules` de `npm ci` |
| Cambios preexistentes | upgrades 01–04 aprobados e integrados en working tree |

## Registro cronológico resumido

1. Spec redactada y aprobada (v1). Ambigüedades declaradas (una sola
   puerta `(19,7)`, activación `F` con proximidad, regla anti-atasco,
   recalculo de ruta, cambio en `application` para obtener mapa dinámico).
2. Plan aprobado. Ajustes de implementación durante la integración: se
   eliminaron variables no usadas (`LAB_MAP`, `observer`, `target`), se
   reemplazó `keyboard` por `this.input.keyboard!` y se removió `isWalkable`
   no usado en `labLevel.ts`.
3. Incremento 1: `labMapWithDoor(open)` + `DOOR_CELL`, `LAB_MAP` derivado;
   `tests/application/labLevel.test.ts` (3 pruebas) OK.
4. Incremento 2: puerta en escena — tecla `F` (proximidad Manhattan ≤1),
   regla "no cierra si jugador sobre la celda", colisión recalcada
   recreando `walls` (`rebuildWalls()`), mapa dinámico para ruta, percepción
   y dibujo, marcador y HUD `PUERTA CERRADA/ABIERTA`, `R` restaura estado.
5. `npm run validate` final → EXIT=0, 11 archivos / 91 pruebas, build OK.

Iteraciones: 3 incrementos, 0 fallos bloqueantes tras ajustes menores.

## Comandos y resultados

| Comando | Resultado | Código de salida |
|---|---|---|
| `npm run typecheck` (tras cambios) | sin errores (ajustes aplicados) | 0 |
| `npx vitest run tests/application/labLevel.test.ts` | 3 pruebas OK | 0 |
| `npm run validate` (final) | typecheck OK; 91 pruebas en 11 archivos OK; build OK | 0 |

## Diferencias (diff)

- Modificado: `src/application/simulation/labLevel.ts` — 16 inserciones,
  5 eliminaciones (nueva API de puerta, `LAB_MAP` derivado)
- Modificado: `src/game/scenes/GameScene.ts` — 213 inserciones,
  19 eliminaciones (estado de puerta, tecla `F`, `rebuildWalls`, uso de
  `labMapWithDoor`, marcador, HUD)
- Nuevo: `tests/application/labLevel.test.ts` (3 pruebas)
- `src/domain/` sin cambios
- `git diff --stat` total: 2 archivos modificados, +229/-24
- Archivos nuevos/documentales del paquete: `docs/upgrades/05-puerta-atajo/{spec,plan,evidencia}.md`

## Matriz criterio → comprobación → resultado

| Criterio | Comprobación | Resultado |
|---|---|---|
| C1 `F` alterna con Manhattan ≤1, nunca cierra con el jugador sobre la celda | Revisión visual: acercar, pulsar F → abre; lejos → no cambia; sobre celda → no cierra | Cumple — aprobado |
| C2 `labMapWithDoor(false)` bloquea `DOOR_CELL`, `true` la abre; resto conservado | Tests unitarios `labLevel.test.ts` | Cumple — aprobado |
| C3 Jugador no atraviesa cerrada; atraviesa abierta | Revisión visual de colisión y cruce | Cumple — aprobado |
| C4 Al alternar, ruta recalcula con mapa nuevo; sin celdas bloqueadas | Revisión visual con clic tras alternar | Cumple — aprobado |
| C5 Estado visible (marcador + HUD) y `R` restaura puerta cerrada | Revisión visual de HUD `PUERTA CERRADA/ABIERTA` y reinicio | Cumple — aprobado |
| C6 `src/domain/` sin cambios; cambios en `application` limitados a API de puerta | `git status` / `git diff --stat` | Cumple — aprobado |
| C7 `npm run validate` correcto | Ejecución final con código de salida | Cumple (EXIT=0) |

## Limitaciones

- Una sola puerta (`(19,7)`), fuera de alcance varias puertas.
- El mapa dinámico para colisión se gestiona recreando el grupo de paredes
  al alternar (ligero y funcional); alternativa más sofisticada (tween,
  puerta física) queda fuera de alcance.
- Recalculo de ruta ocurre al alternar; si el destino queda inaccesible tras
  cerrar, el guardia queda sin ruta (comportamiento existente de A*).
- Advertencia preexistente de build (chunk > 500 kB) persiste.
- Sin commits: cambios en working tree, pendientes de autorización humana.

## Decisión humana

- Spec aprobada: sí (2026-10-06).
- Plan aprobado: sí.
- C1–C7 revisadas y aprobadas: sí.
- **Recomendación del agente: integrar.** Decisión final (integrar /
  corregir / revertir / descartar) pendiente de registro por la persona
  estudiante.
