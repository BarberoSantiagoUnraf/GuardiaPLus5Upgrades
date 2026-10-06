---
id: upgrade-02-impacto-visual
titulo: Upgrade 4 — Impacto visual extremo de alerta
tipo: upgrade
estado: borrador
fecha: 2026-10-06
version: 1
---

# Spec — Impacto visual extremo de alerta

## Problema

Cuando el guardia detecta al jugador, el cambio se comunica sólo con el
relleno del cono y una línea del HUD (`src/game/scenes/GameScene.ts`,
`updateTelemetry`). No hay respuesta inmediata y contundente en pantalla:
la detección pasa inadvertida si el jugador mira su personaje y no el HUD.

## Intención de diseño

Que detectar al jugador se sienta como un acontecimiento imposible de
ignorar: una descarga breve y terminada que no arruina el control ni la
legibilidad del resto de la escena.

## Objetivo

Producir una respuesta de alerta extrema —shake de cámara, flash y
acercamiento sutil— que se active exactamente en la detección, termine y
restaure el estado normal en menos de un segundo, sin modificar el
comportamiento del guardia ni del jugador.

## Alcance

- Disparador: la transición de `VisionResult.visible` de `false` a `true`
  (evento ya rastreado en `GameScene.updatePerception`).
- Efectos, todos por código y sobre la cámara de Phaser:
  - *shake* de cámara con amplitud y duración acotadas;
  - *flash* blanco breve sobre la cámara;
  - *zoom* momentáneo de ida y vuelta (valor de reposo → repunte → reposo).
- Duración total del efecto menor a 1000 ms, con restauración garantizada
  de `zoom` y `scroll` a sus valores de reposo.
- Un solo efecto por transición: mientras `visible` permanezca `true` no se
  reactiva.
- Módulo puro de lógica de alerta en `src/game/presentation/` con pruebas
  unitarias (patrón del upgrade 01).

## Fuera de alcance

- Cambiar `src/domain/perception/` o cualquier símbolo de detección
  (`evaluateVision`, `VisionResult`, memoria, sonido).
- Movimiento, navegación, estados del guardia.
- Audio, partículas, cambio de color de escenario o de actores.
- Efectos sobre el jugador (knockback, invulnerabilidad).
- Dependencias nuevas y recursos externos.

## Restricciones

- Sólo se modifica `src/game/` (+ documentación del paquete).
- `src/domain/` y `src/application/` sin cambios.
- TypeScript estricto; `npm run validate` con código de salida 0.
- Sin recursos descargados; todo dibujado por código.
- El efecto no debe impedir controlar al jugador ni ocultar el HUD de forma
  permanente.

## Caso normal

1. El jugador entra en el cono sin oclusión → `visible` pasa a `true`.
2. En ese mismo cuadro se dispara la alerta: shake + flash + zoom de ida.
3. Antes de 1000 ms el efecto termina y la cámara queda en reposo
   (`zoom = 1`, `scroll` en su posición previa).
4. El cono permanece en estado de detección (upgrade 01) sin nuevo efecto.

## Casos límite

- Pérdida y recuperación de visión en menos de 1000 ms: cada transición
  `false → true` dispara un efecto nuevo; no se superponen de forma
  descontrolada (se reinicia el timing).
- `visible` permanece `true` varios segundos: se dispara una única vez.
- Reinicio con R durante el efecto: la escena renace con la cámara en
  reposo (zoom 1, sin shake).
- Detección inicial en el primer cuadro de la escena: sólo aplica si hubo
  transición real `false → true` dentro de la escena.
- El jugador sigue recibiendo input durante el efecto.

## Criterios de aceptación

| N.º | Criterio | Prueba prevista |
|---|---|---|
| C1 | El efecto se activa exactamente en la transición `visible: false → true` y no antes ni después | Revisión visual sincronizada con el HUD (`vision VISIBLE`) al entrar al cono |
| C2 | La duración total del efecto es menor a 1000 ms y la cámara termina en reposo (`zoom = 1`, sin shake) | Prueba unitaria del módulo de timing + revisión visual del retorno |
| C3 | Mientras `visible` sigue `true` no se repite el efecto | Prueba unitaria (sin re-disparo) + revisión visual permaneciendo en el cono |
| C4 | Una nueva transición `false → true` vuelve a disparar el efecto | Revisión visual: salir y volver a entrar al cono |
| C5 | El jugador mantiene control y el HUD permanece legible durante y después del efecto | Revisión visual: mover al jugador durante la alerta |
| C6 | Reinicio con R durante el efecto deja la cámara en reposo | Revisión visual: pulsar R con la alerta activa |
| C7 | Ningún archivo de `src/domain/` ni `src/application/` fue modificado | `git status` / `git diff --stat` |
| C8 | El proyecto valida completo | `npm run validate` con código de salida 0 |

## Evidencia prevista

- `git status` y `git diff --stat` inicial y final.
- Comandos `npm run validate` y de pruebas con códigos de salida.
- Registro visual (capturas o reproducción) de: activación, curso y retorno
  del efecto, y de reinicio durante la alerta — obligatorio porque modifica
  feedback y cámara.
- Matriz criterio → comprobación → resultado en `evidencia.md`.
