---
id: upgrade-04-lure-sonoro
titulo: Upgrade 7 — Distractores sonoros interactivos
tipo: upgrade
estado: borrador
fecha: 2026-10-06
version: 1
---

# Spec — Distractores sonoros interactivos

## Problema

Hoy el único sonido es `Q`, que emite un evento en la posición del jugador
con radio y duración fijos (`GameScene.update`, `SOUND_RADIUS = 190`,
`SOUND_DURATION_MS = 800`). El jugador no puede elegir *dónde* sembrar
ruido: no hay oportunidad ni planificación, sólo una acción gratuita y
siempre disponible.

## Intención de diseño

Dar al jugador una herramienta de engaño con costo: colocar ruido en un
lugar que no es el suyo para sembrar una posición falsa en la memoria del
guardia, decidiendo cuándo y dónde gastar un recurso limitado.

## Objetivo

Agregar señuelos sonoros desplegables con cargas y enfriamiento, que
producen el mismo efecto perceptivo que cualquier sonido (escucha, memoria,
marcador y HUD) sin modificar visión, navegación ni la detección existente.

## Alcance

- Nueva tecla `E`: despliega un señuelo en la dirección del puntero del
  mouse, desde el jugador hasta un alcance máximo de 160 px (si el puntero
  está más cerca, en la posición del puntero).
- Recursos: 3 cargas iniciales, una carga por despliegue, enfriamiento de
  5000 ms entre despliegues. Sin cargas o en enfriamiento → no se emite.
- El señuelo genera un `SoundEvent` con `radius = 260` y
  `durationMs = 1200` en la posición calculada; el sonido atraviesa
  paredes (coherente con `evaluateSound`, que sólo mide distancia).
- Un solo evento sonoro vigente a la vez: el despliegue más reciente
  reemplaza al anterior (comportamiento actual de `withSoundEvent`).
- Efecto observable: círculo del evento en pantalla, `sonido OIDO` en el
  HUD si el guardia está en radio y vigente, y movimiento del marcador de
  última posición conocida (`lastKnownMarker`) a la posición del señuelo.
- HUD de recursos: cargas restantes y enfriamiento (texto en la escena).
- Restauración: `R` reinicia cargas, enfriamiento y evento sonoro.
- Lógica pura (recursos, enfriamiento y cálculo de posición de lanzamiento)
  en `src/game/presentation/` con pruebas unitarias.

## Fuera de alcance

- Estados del guardia: el guardia **no** se desvía físicamente hacia el
  sonido (no existe `Investigar`); la "desvío" es por memoria y queda
  visible en el marcador y el HUD.
- Cambiar `src/domain/perception/` (`evaluateSound`, `memory`,
  `perceptionSimulation`).
- Visión, navegación, movimiento, estados, audio con recursos externos.
- Múltiples eventos sonoros simultáneos.
- Dependencias nuevas.

## Restricciones

- Sólo se modifica `src/game/` (+ documentación del paquete).
- `src/domain/` y `src/application/` sin cambios.
- TypeScript estricto; `npm run validate` con código de salida 0.
- Sin recursos descargados; el HUD se dibuja con `Text` existente.

## Caso normal

1. El jugador pulsa `E` con 3 cargas y sin enfriamiento → se coloca un
   señuelo en la dirección del puntero (máx. 160 px) → cargas = 2,
   enfriamiento en marcha.
2. Si el guardia está a ≤260 px del señuelo mientras dura (1200 ms), el
   HUD muestra `sonido OIDO` y el marcador de última posición conocida se
   mueve a la posición del señuelo.
3. El jugador repite cada 5 s hasta agotar las cargas.
4. `R` restaura 3 cargas y limpia el evento.

## Casos límite

- `E` con 0 cargas o durante el enfriamiento: no se emite nada; el HUD
  muestra la condición (cargas en 0 o "ENFRIANDO").
- Puntero sobre o muy cerca del jugador: el señuelo se coloca en esa
  posición (alcance 0).
- `E` reemplaza un evento de `Q` aún vigente (y viceversa): sólo queda el
  más reciente.
- El señuelo se coloca fuera de una pared o en celda no transitable: se
  permite (el sonido atraviesa paredes); el círculo se dibuja igual.
- Guardia fuera de radio o evento ya expirado: `sonido FUERA DE RANGO` o
  `-` en el HUD; la memoria no cambia.
- Reinicio durante el enfriamiento: todo vuelve al estado inicial.

## Criterios de aceptación

| N.º | Criterio | Prueba prevista |
|---|---|---|
| C1 | `E` sólo emite cuando hay cargas y no hay enfriamiento; consume exactamente una carga por emisión | Prueba unitaria del módulo de recursos + revisión visual con HUD |
| C2 | El señuelo se coloca en la dirección del puntero, a ≤160 px del jugador | Prueba unitaria del cálculo de posición (clamps de distancia) + revisión visual |
| C3 | Con el guardia en radio y vigente, el HUD muestra `sonido OIDO` y `lastKnownPosition` = posición del señuelo | Revisión visual sincronizada con el marcador rojo y el HUD (ya cubierto por `evaluateSound`/`rememberObservation`, sin cambios de dominio) |
| C4 | El enfriamiento dura 5000 ms y las cargas iniciales son 3; `R` los restaura | Prueba unitaria del enfriamiento/cargas + revisión visual del reinicio |
| C5 | Ningún archivo de `src/domain/` ni `src/application/` fue modificado | `git status` / `git diff --stat` |
| C6 | El proyecto valida completo | `npm run validate` con código de salida 0 |

## Evidencia prevista

- `git status` y `git diff --stat` inicial y final.
- Comandos `npm run validate` y de pruebas con códigos de salida.
- Registro visual (capturas o reproducción) de: despliegue con consumo de
  carga, escucha con movimiento del marcador, bloqueo sin cargas y
  restauración con `R` — obligatorio porque modifica interfaz y feedback.
- Matriz criterio → comprobación → resultado en `evidencia.md`.
