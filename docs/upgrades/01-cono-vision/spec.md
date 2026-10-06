---
id: upgrade-01-cono-vision
titulo: Upgrade 2 — Cono de visión visible y reactivo
tipo: upgrade
estado: borrador
fecha: 2026-10-06
version: 1
---

# Spec — Cono de visión visible y reactivo

## Problema

El cono de visión se dibuja con un relleno plano y sin borde
(`GameScene.drawPerception`, `src/game/scenes/GameScene.ts:302`). El jugador
no distingue con claridad los límites del alcance ni percebe al instante
cuando el guardia lo detectó: el único indicador de detección es una línea
del HUD (`vision VISIBLE`) y un cambio de relleno casi imperceptible.

## Intención de diseño

Que el jugador entienda de un vistazo, sin leer el HUD, dos cosas: el
alcance exacto de la mirada del guardia y el momento en que lo detectó.

## Objetivo

Hacer el cono de visión legible en reposo y diferenciable en detección,
manteniendo la presentación sincronizada con el resultado del dominio.

## Alcance

- Borde visible y continuo en el contorno del cono, con color propio.
- Color de relleno distinto para estado de detección y estado en reposo,
  derivado de `VisionResult.visible`.
- Sincronización: el estado visual del cono se actualiza en el mismo cuadro
  en que cambia `VisionResult.reason`.
- Transición de cambio de estado con duración máxima de 300 ms (apagado o
  encendido del estado de detección), sin efectos persistentes.
- El cono conserva la posición, ángulo y alcance actuales
  (`guardFacing`, `VISION_RANGE`, `FIELD_OF_VIEW`).

## Fuera de alcance

- Cambiar `evaluateVision`, `VisionResult`, `VisionReason` o cualquier
  símbolo de `src/domain/perception/`.
- Cambiar detección, memoria, sonido, navegación o movimiento.
- Estados del guardia (Patrullar/Investigar/Perseguir).
- Audio, partículas, shake de cámara o efectos de alerta (upgrades 4 y 5).
- Sprites o recursos externos: todo se dibuja por código con Graphics.

## Restricciones

- `src/domain/` no importa Phaser ni DOM; los cambios se limitan a
  `src/game/` (presentación no decide comportamiento).
- Sin dependencias nuevas.
- TypeScript estricto; `npm run validate` debe finalizar correctamente.
- Sin recursos externos descargados.

## Caso normal

1. El guardia mira en reposo: cono con borde visible y relleno de reposo.
2. El jugador entra en el cono y no hay oclusión → `reason` pasa a
   `"visible"`; en el mismo cuadro el cono adopta el color de detección
   con una transición de hasta 300 ms.
3. El jugador sale del alcance o queda ocluido → `reason` deja de ser
   `"visible"`; el cono vuelve al estado de reposo dentro de 300 ms.

## Casos límite

- Detección y pérdida en cuadros consecutivos: el estado visual nunca queda
  congelado en detección más de 300 ms tras cambiar `reason`.
- `reason === "invalid-facing"` (facing nulo): el cono se dibuja en estado
  de reposo, sin detección.
- Reinicio con R durante una transición: la escena renace en estado de
  reposo.
- Motivo `"outside-cone"`, `"out-of-range"` u `"occluded"` con
  `visible === false`: siempre estado de reposo, nunca estado de detección.

## Criterios de aceptación

| N.º | Criterio | Prueba prevista |
|---|---|---|
| C1 | El cono tiene un borde visible diferenciable del relleno en todo momento | Revisión visual en ejecución: contorno perceptible sobre fondo `#10161c` |
| C2 | El color de relleno de detección se activa exactamente cuando `VisionResult.visible === true` y se desactiva cuando es `false` | Revisión visual sincronizada con HUD (`vision VISIBLE` / otros) durante entrada y salida del cono |
| C3 | El estado visual de detección se apaga en menos de 300 ms después de que `visible` pasa a `false` | Revisión visual con salida abrupta del jugador del cono (medición aprox. o conteo de cuadros) |
| C4 | La geometría (posición, ángulo, alcance) no cambia respecto de la versión inicial | Diff: sin cambios a `guardFacing`, `VISION_RANGE`, `FIELD_OF_VIEW` ni a `evaluateVision` |
| C5 | Ningún archivo de `src/domain/` fue modificado | `git diff --stat` sin cambios en `src/domain/` |
| C6 | El proyecto valida completo | `npm run validate` con código de salida 0 |

## Evidencia prevista

- `git status` y `git diff` inicial y final (punto de referencia del repo).
- Comando `npm run validate` con código de salida.
- Registro visual de la escena: reproducción o capturas de los tres
  tramos (reposo → detección → retorno), porque modifica interfaz/feedback.
- Matriz criterio → comprobación → resultado en `evidencia.md`.
