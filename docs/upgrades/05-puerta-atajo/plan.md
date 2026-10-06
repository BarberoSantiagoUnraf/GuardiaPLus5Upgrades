---
id: upgrade-05-puerta-atajo-plan
titulo: Plan — Upgrade 10 Puertas, atajos o rutas bloqueables
tipo: upgrade-plan
estado: aprobado
fecha: 2026-10-06
version: 1
---

# Plan — Puertas, atajos o rutas bloqueables

Spec de referencia: `docs/upgrades/05-puerta-atajo/spec.md` (v1, aprobada).

## Punto inicial

- Fecha: 2026-10-06
- Versión del proyecto: 0.1.0, commit `5a1a34d`, rama `main`
- Estado Git: upgrades 01–04 en working tree (aprobados, sin commit)
- Validación de referencia: `npm run validate` → EXIT=0, 10 archivos / 88
  pruebas (cierre del upgrade 04)

## Incrementos

### Incremento 1 — API del mapa con puerta (C1, C2)

- **Archivo modificado:** `src/application/simulation/labLevel.ts`
  - `export const DOOR_CELL: GridPoint = { x: 19, y: 7 }`
  - `export const DOOR_OPEN = false`
  - `export function labMapWithDoor(open: boolean): GridMap` — construye
    bloqueados incluyendo o excluyendo `DOOR_CELL` (con `createGridMap`)
  - `LAB_MAP` pasa a derivarse con puerta cerrada (`labMapWithDoor(false)`)
  para conservar el comportamiento actual y permitir el switch en escena
- **Archivo nuevo:** `tests/application/labLevel.test.ts`
  - puerta cerrada: `isWalkable` de `DOOR_CELL` es `false`
  - puerta abierta: `isWalkable` de `DOOR_CELL` es `true`
  - el resto de celdas bloqueadas/transitables se conserva
- **Validación:** `npx vitest run tests/application/labLevel.test.ts` y
  `npm run typecheck`
- **Riesgo:** medio (cambia la construcción del mapa existente); los tests
  del dominio/percepción siguen con LAB_MAP coherente
- **Condición de detención:** si las pruebas existentes fallan por este
  cambio o se toca `src/domain/`

### Incremento 2 — Integración en la escena (C1, C3, C4, C5)

- **Archivo modificado:** `src/game/scenes/GameScene.ts`
  - estado `doorOpen` inicializado en `false`, restaurado en `create()`
  - tecla `F`: distancia Manhattan ≤1 de `DOOR_CELL`, no permite cerrar si
    el jugador está sobre la celda; al alternar: `doorOpen = !doorOpen`,
    recalcula ruta (`renderNavigation()`) con nuevo mapa y actualiza HUD
  - mapa dinámico: obtener `labMapWithDoor(doorOpen)` para cálculo de ruta
    y para el dibujado de paredes? (las paredes estáticas se crean en
    `create()`; la puerta es una celda que pasa a transitable: al abrir, la
    celda bloqueada deja de existir como muro estático; para que el jugador
    atraviese y A* la vea transitable, el mapa pasa a incluirla abierta)
    pero las paredes ya creadas en `create()` son estáticas (Physics.Arcade
    staticGroup). Solución: recrear paredes según mapa actual o agregar
    dibujo visual y dejar colisión a nivel lógico (jugador no atraviesa
    muros por colisión Arcade con staticGroup; al abrir puerta, esa celda
    deja de tener wall → borrar/recrear grupo de paredes o simplemente
    marcar: recrear las paredes en función de `labMapWithDoor(doorOpen)`)
    cada vez que cambia el estado (ligero) o alternar la visibilidad de un
    rectángulo específico para `(19,7)`.
- **Validación:** `npm run typecheck` + revisión visual
- **Riesgo:** medio (colisión vs mapa lógico). Usaremos mapa lógico para
  A* y recalcularemos ruta al alternar; para colisión Arcade, recreamos las
  paredes cuando cambia `doorOpen` (mismo patrón de `create()`), o
  dibujamos y aceptamos que colisión Arcade sobre esa celda específica se
  gestiona recreando el grupo. Alternativa segura: al abrir/cerrar, destruir
  el grupo de paredes y volver a construirlo con el mapa actual.
- **Detención:** si el jugador queda atascado o la ruta contiene celdas
  bloqueadas

### Incremento 3 — Validación y cierre (C6, C7 + evidencia)

- **Archivo nuevo:** `docs/upgrades/05-puerta-atajo/evidencia.md`
- **Validación:** `npm run validate`, `git status`, `git diff --stat`,
  `npx vitest run tests/application/labLevel.test.ts` + capturas
- **Riesgo:** bajo
- **Condición de detención:** `validate` falla por causa no comprendida;
  ningún commit sin autorización humana

## Fueras de alcance confirmados

- Varias puertas, animaciones, que el guardia active la puerta
- Cambios en `src/domain/`
- Dependencias nuevas, recursos externos
