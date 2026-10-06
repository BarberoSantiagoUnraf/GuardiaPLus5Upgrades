import type { Vector2 } from "../../domain/model/vector";

export const TENSION_ZOOM = 0.85;
export const TENSION_IN_MS = 500;
export const TENSION_RETURN_DELAY_MS = 500;
export const TENSION_RETURN_MS = 1000;

export type TensionPhase = "base" | "entering" | "holding" | "grace" | "returning";

export interface TensionState {
  readonly phase: TensionPhase;
  readonly progress: number;
  readonly graceElapsedMs: number;
}

export function initialTensionState(): TensionState {
  return { phase: "base", progress: 0, graceElapsedMs: 0 };
}

export function advanceTension(
  state: TensionState,
  visible: boolean,
  deltaMs: number,
): TensionState {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    throw new Error("Tension delta must be a finite, non-negative value.");
  }

  switch (state.phase) {
    case "base":
      if (!visible) {
        return state;
      }
      return stepTension({ ...state, phase: "entering" }, deltaMs, TENSION_IN_MS, 1);
    case "entering":
      if (!visible) {
        return enterGrace(state.progress, deltaMs);
      }
      return stepTension(state, deltaMs, TENSION_IN_MS, 1);
    case "holding":
      if (visible) {
        return state;
      }
      return enterGrace(state.progress, deltaMs);
    case "grace":
      if (visible) {
        return state.progress >= 1
          ? { phase: "holding", progress: 1, graceElapsedMs: 0 }
          : stepTension(
            { phase: "entering", progress: state.progress, graceElapsedMs: 0 },
            deltaMs,
            TENSION_IN_MS,
            1,
          );
      }
      return startReturnIfGraceExpired(state, deltaMs);
    case "returning": {
      if (visible) {
        return stepTension({ ...state, phase: "entering" }, deltaMs, TENSION_IN_MS, 1);
      }
      return stepTension(state, deltaMs, TENSION_RETURN_MS, 0);
    }
  }
}

export function tensionZoom(progress: number): number {
  const clamped = clamp01(progress);
  return 1 + (TENSION_ZOOM - 1) * clamped;
}

export function tensionScroll(
  base: Vector2,
  guard: Vector2,
  player: Vector2,
  progress: number,
): Vector2 {
  const clamped = clamp01(progress);
  const focus = { x: (guard.x + player.x) / 2, y: (guard.y + player.y) / 2 };
  return {
    x: base.x + (focus.x - base.x) * clamped,
    y: base.y + (focus.y - base.y) * clamped,
  };
}

function stepTension(
  state: TensionState,
  deltaMs: number,
  durationMs: number,
  target: number,
): TensionState {
  const direction = target > state.progress ? 1 : -1;
  const next = state.progress + direction * (deltaMs / durationMs);
  const progress = clamp01(next);
  const reached = direction > 0 ? progress >= 1 : progress <= 0;
  if (reached) {
    return {
      phase: direction > 0 ? "holding" : "base",
      progress: direction > 0 ? 1 : 0,
      graceElapsedMs: 0,
    };
  }
  return { ...state, progress };
}

function enterGrace(progress: number, deltaMs: number): TensionState {
  if (deltaMs >= TENSION_RETURN_DELAY_MS) {
    return { phase: "returning", progress, graceElapsedMs: 0 };
  }
  return { phase: "grace", progress, graceElapsedMs: deltaMs };
}

function startReturnIfGraceExpired(state: TensionState, deltaMs: number): TensionState {
  const graceElapsedMs = state.graceElapsedMs + deltaMs;
  if (graceElapsedMs >= TENSION_RETURN_DELAY_MS) {
    return { phase: "returning", progress: state.progress, graceElapsedMs: 0 };
  }
  return { ...state, graceElapsedMs };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
