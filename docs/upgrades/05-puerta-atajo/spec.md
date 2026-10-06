---
id: upgrade-05-puerta-atajo
titulo: Upgrade 10 — Puertas, atajos o rutas bloqueables
tipo: upgrade
estado: borrador
fecha: 2026-10-06
version: 1
---

# Spec — Puertas, atajos o rutas bloqueables

## Problema

El mapa `LAB_MAP` (`src/application/simulation/labLevel.ts`) es estático:
las paredes y pasillos nunca cambian. La estrategia del jugador es fija de
principio a fin: no puede transformar el espacio, crear un atajo ni cerrar
un camino para condicionar las rutas.

## Intención de diseño

Dar al jugador una palanca sobre el nivel: abrir o cerrar una puerta que
aparece o suprime un atajo, decidiendo cuándo exponerse a activarla y qué
camino quiere dejar disponible o bloqueado.

## Objetivo

Implementar una puerta en una apertura del mazo cuyo estado alterne la
transitabilidad de una celda para el jugador y para la navegación A* del
guardia, con activación por proximidad, estado visible y reinicio
reproducible.

## Alcance

- **Apertura nueva:** celda `(19, 7)` del muro vertical `x = 19`
  (`BLOCKED_AREAS` en `labLevel.ts`), que hoy separa el pasillo
  `x=16..18` de la zona `x=20..28`.
- **Puerta:** la celda `(19, 7)` en estado **cerrada** al inicio (mapa
  idéntico al actual) y **abierta** tras activarse.
- **API de mapa en `application`:**
  - `DOOR_CELL: GridPoint` y `DOOR_OPEN` constante de estado inicial;
  - `labMapWithDoor(open: boolean): GridMap` — devuelve el mapa con la
    celda de la puerta bloqueada (cerrada) o transitables (abierta),
    construido con `createGridMap` (dominio);
  - `LAB_MAP` se conserva como mapa con la puerta cerrada (compatibilidad
    con usos y pruebas existentes).
- **Activación:** tecla `F` con el jugador a distancia Manhattan ≤1 celda
  de `DOOR_CELL`; sin proximidad → no alterna.
- **Regla de seguridad:** no se permite cerrar si el jugador está sobre la
  celda de la puerta (evita atascos); `F` en ese caso no hace nada.
- **Efectos al alternar:**
  - colisión: la celda deja de bloquear al jugador cuando está abierta;
  - navegación: la ruta actual del guardia se recalcula con el mapa nuevo;
    si el destino o el inicio quedan inválidos, A* produce su fracaso
    explícito existente y el guardia queda sin ruta;
  - visual: la celda se dibuja como muro cuando está cerrada y como marco
    de puerta cuando está abierta, con una línea en el HUD
    (`PUERTA CERRADA` / `PUERTA ABIERTA`).
- **Reinicio:** `R` restaura la puerta cerrada.
- **Pruebas:** `tests/application/labLevel.test.ts` para
  `labMapWithDoor` (transitabilidad diferencial de `DOOR_CELL` y
  conservación del resto del mapa).
- Archivos previstos: `src/application/simulation/labLevel.ts`,
  `src/game/scenes/GameScene.ts`, `tests/application/labLevel.test.ts`
  (+ documentación del paquete).

## Fuera de alcance

- Varias puertas, estados intermedios, animaciones de apertura.
- Que el guardia active puertas o decida sobre ellas.
- Cambios en `src/domain/` (A*, grid, percepción): la puerta sólo aporta
  un mapa distinto a los algoritmos existentes.
- Estados del guardia, audio, dependencias nuevas, recursos externos.

## Restricciones

- `src/domain/` sin cambios; `application` sólo agrega la derivación del
  mapa; `game/` adapta tecla, colisión y dibujo.
- TypeScript estricto; `npm run validate` con código de salida 0.
- Sin recursos descargados.
- Los invariantes del producto se conservan: una ruta nunca contiene
  celdas bloqueadas; el estado informado coincide con el comportamiento
  ejecutado.

## Caso normal

1. Estado inicial: puerta cerrada, mapa igual al actual, HUD
   `PUERTA CERRADA`.
2. El jugador se acerca (≤1 celda) y pulsa `F` → puerta abierta: la celda
   se dibuja como marco, el jugador puede cruzar, la ruta del guardia se
   recalcula y puede usar el atajo.
3. El jugador pulsa `F` de nuevo lejos de la celda → puerta cerrada: el
   jugador queda bloqueado y la ruta del guardia se recalcula sin esa celda.
4. `R` → puerta cerrada y mapa de partida.

## Casos límite

- `F` sin proximidad: sin cambios; el HUD conserva el estado.
- `F` con el jugador sobre la celda de la puerta: no se cierra (regla de
  seguridad), el estado no cambia.
- Cierre con ruta activa del guardia: se recalcula en el mismo evento; si
  el destino queda inalcanzable, el guardia queda sin ruta (fracaso
  `unreachable`/inválido explícito de A*), sin navegación fantasma.
- El guardia con inicio en una celda que quedó bloqueada tras cerrar:
  A* reporta inicio inválido, el guardia no se mueve.
- Reinicio con la puerta abierta durante una ruta: todo vuelve al estado
  inicial (puerta cerrada, ruta de referencia).
- La puerta abierta no cambia la percepción: visión y oclusión siguen
  usando las celdas del mapa que se les pasa; el cono puede atravesar la
  apertura sólo si la celda es transitable en ese mapa.

## Criterios de aceptación

| N.º | Criterio | Prueba prevista |
|---|---|---|
| C1 | `F` alterna el estado sólo con el jugador a Manhattan ≤1 de `DOOR_CELL`, y nunca cierra con el jugador sobre la celda | Prueba unitaria de la API de mapa + revisión visual de `F` con y sin proximidad |
| C2 | Con la puerta cerrada, `labMapWithDoor(false)` tiene `DOOR_CELL` no transitable y `labMapWithDoor(true)` sí, conservando el resto de celdas | `tests/application/labLevel.test.ts` |
| C3 | Con la puerta cerrada, el jugador no atraviesa la celda; abierta, la atraviesa | Revisión visual de choque/cruce en la escena |
| C4 | Al alternar, la ruta del guardia se recalcula con el mapa nuevo y nunca contiene la celda bloqueada | Revisión visual con clic de destino tras alternar + invariante de A* (pruebas de dominio existentes) |
| C5 | El estado es visible (dibujo + HUD) y `R` restaura la puerta cerrada | Revisión visual |
| C6 | `src/domain/` sin cambios; cambios en `application` limitados a la API de la puerta | `git status` / `git diff --stat` |
| C7 | El proyecto valida completo | `npm run validate` con código de salida 0 |

## Evidencia prevista

- `git status` y `git diff --stat` inicial y final.
- Comandos `npm run validate` y `npx vitest run tests/application/labLevel.test.ts`
  con códigos de salida.
- Registro visual (capturas o reproducción) de: bloqueo cerrado, apertura,
  cruce, recálculo de ruta del guardia y reinicio — obligatorio porque
  modifica el espacio y la interfaz.
- Matriz criterio → comprobación → resultado en `evidencia.md`.
