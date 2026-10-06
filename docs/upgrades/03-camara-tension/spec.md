---
id: upgrade-03-camara-tension
titulo: Upgrade 5 — Cámara dinámica de tensión
tipo: upgrade
estado: borrador
fecha: 2026-10-06
version: 1
---

# Spec — Cámara dinámica de tensión

## Problema

La cámara de la escena es estática: no sigue ni reencuadra nada
(`GameScene` no configura `setScroll`/`centerOn`). Cuando el jugador está
en riesgo de ser visto, la pantalla no lo representa: el encuadre no ayuda a
evaluar la maniobra de escape ni transmite que algo grave está pasando.

## Intención de diseño

Que mientras el riesgo dura, el encuadre muestre las dos piezas de la
maniobra —guardia y jugador— con una mirada ampliada, y que soltarlo se
sienta como alivio: la cámara se acerca al peligro y se retira.

## Objetivo

Aplicar un encuadre de tensión sostenido mientras el jugador es visible
para el guardia, con transiciones interpoladas de ida y vuelta, sin modificar
comportamiento, detección ni navegación.

## Alcance

- Disparador sostenido: `VisionResult.visible === true` (resultado del
  dominio, ya disponible en `GameScene.updatePerception`).
- Encuadre base: el estado de reposo de la cámara (`scrollX`, `scrollY`,
  `zoom = 1`), registrado al salir de tensión y en `create()`.
- Encuadre de tensión: `scroll` centrado entre guardia y jugador con
  `zoom` de tensión (valor fijo 0.85).
- Ida: al iniciar tensión, interpolación desde el encuadre base hasta el de
  tensión con convergencia ≤500 ms.
- Vuelta: cuando `visible` lleva `false` más de 500 ms (gracia), la cámara
  regresa al encuadre base en ≤1000 ms y se detiene.
- Suavizado por cuadro (sin saltos) durante toda la transición.
- Lógica pura del encuadre en `src/game/presentation/` con pruebas
  unitarias (patrón de los upgrades 01 y 02).
- Composición con upgrade 02: mientras la alerta de detección está activa
  (`alertPhase.active`), el zoom momentáneo del 02 prevalece sobre el de
  tensión; el `scroll` de tensión se aplica igualmente y no interfiere con
  el shake (Phaser aplica el shake como desplazamiento de render).

## Fuera de alcance

- Cambiar `src/domain/` o `src/application/` (detección, memoria, rutas).
- Seguimiento del jugador fuera de tensión (la cámara de reposo no pasa a
  seguir al jugador de forma permanente).
- Audio, partículas, estados del guardia, HUD.
- Recursos externos y dependencias nuevas.

## Restricciones

- Sólo se modifica `src/game/` (+ documentación del paquete).
- TypeScript estricto; `npm run validate` con código de salida 0.
- El jugador mantiene el control y el HUD permanece visible durante la
  tensión (el flash del upgrade 02 es una excepción ya aceptada en ese
  upgrade).
- Sin recursos descargados.

## Caso normal

1. El jugador entra en el cono → `visible = true`; comienza la ida.
2. En ≤500 ms la cámara llega al encuadre de tensión (zoom 0.85 centrado
   entre guardia y jugador) y lo mantiene mientras `visible` sea `true`.
3. El jugador pierde la visión (sale del cono / oclusión) → corre la gracia
   de 500 ms; si no hay detección nueva, inicia la vuelta.
4. En ≤1000 ms la cámara está en el encuadre base y se detiene (sin
   consumo continuo de ajuste).

## Casos límite

- Pérdida y recuperación de visión dentro de los 500 ms de gracia: no se
  inicia la vuelta; el encuadre de tensión se mantiene sin oscilar.
- Detecciones breves repetidas: la ida se reinicia desde la posición actual
  (sin saltos a posiciones anteriores).
- Reinicio con R durante la tensión: `create()` restaura encuadre base
  (zoom 1, scroll de reposo, sin interpolación pendiente).
- Alerta del upgrade 02 superpuesta al entrar en tensión: el zoom vuelve a
  1 al terminar la alerta y la tensión retoma su zoom (no queda en 1 ni en
  un valor residual).
- Jugador y guardia muy separados: el encuadre se centra igual entre ambos;
  puede no contenerlos a los dos — limitación aceptada.

## Criterios de aceptación

| N.º | Criterio | Prueba prevista |
|---|---|---|
| C1 | Con `visible = true` sostenido, la cámara converge en ≤500 ms al encuadre de tensión (zoom 0.85, centrada entre guardia y jugador) | Prueba unitaria de interpolación (progreso ≥0.95 en 500 ms) + revisión visual |
| C2 | Tras 500 ms con `visible = false`, la cámara vuelve al encuadre base en ≤1000 ms | Prueba unitaria de la vuelta + revisión visual de salida del cono |
| C3 | Las transiciones son interpoladas, sin cortes bruscos | Revisión visual de ida y vuelta |
| C4 | Tras la alerta del upgrade 02, el zoom de tensión no queda residual (ni en 1 ni en el pico de alerta) | Revisión visual: detección → fin de alerta → tensión activa |
| C5 | `src/domain/` y `src/application/` sin cambios | `git status` / `git diff --stat` |
| C6 | Control del jugador y HUD visibles durante la tensión | Revisión visual: mover al jugador con tensión activa |
| C7 | El proyecto valida completo | `npm run validate` con código de salida 0 |

## Evidencia prevista

- `git status` y `git diff --stat` inicial y final.
- Comandos `npm run validate` y de pruebas con códigos de salida.
- Registro visual (capturas o reproducción) de: ida, tensión sostenida,
  vuelta y reinicio durante tensión — obligatorio porque modifica cámara.
- Matriz criterio → comprobación → resultado en `evidencia.md`.
