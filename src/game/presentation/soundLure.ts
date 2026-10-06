import type { Vector2 } from "../../domain/model/vector";

export const LURE_MAX_CHARGES = 3;
export const LURE_COOLDOWN_MS = 5000;
export const LURE_RANGE = 160;
export const LURE_RADIUS = 260;
export const LURE_DURATION_MS = 1200;

export interface LureState {
  readonly charges: number;
  readonly lastDeployAtMs: number | null;
}

export type DeployResult =
  | { readonly deployed: true; readonly state: LureState; readonly position: Vector2 }
  | {
    readonly deployed: false;
    readonly state: LureState;
    readonly reason: "no-charges" | "cooldown";
  };

export interface LureStatus {
  readonly charges: number;
  readonly cooldownRemainingMs: number;
  readonly ready: boolean;
}

export function initialLureState(): LureState {
  return { charges: LURE_MAX_CHARGES, lastDeployAtMs: null };
}

export function lureCooldownRemainingMs(state: LureState, nowMs: number): number {
  if (!Number.isFinite(nowMs)) {
    throw new Error("Lure timestamp must be finite.");
  }
  if (state.lastDeployAtMs === null) {
    return 0;
  }
  const remaining = state.lastDeployAtMs + LURE_COOLDOWN_MS - nowMs;
  return remaining > 0 ? remaining : 0;
}

export function canDeploy(state: LureState, nowMs: number): boolean {
  return state.charges > 0 && lureCooldownRemainingMs(state, nowMs) <= 0;
}

export function lureStatus(state: LureState, nowMs: number): LureStatus {
  const cooldownRemainingMs = lureCooldownRemainingMs(state, nowMs);
  return {
    charges: state.charges,
    cooldownRemainingMs,
    ready: state.charges > 0 && cooldownRemainingMs <= 0,
  };
}

export function lurePosition(origin: Vector2, pointer: Vector2): Vector2 {
  if (
    !Number.isFinite(origin.x)
    || !Number.isFinite(origin.y)
    || !Number.isFinite(pointer.x)
    || !Number.isFinite(pointer.y)
  ) {
    throw new Error("Lure placement requires finite positions.");
  }
  const deltaX = pointer.x - origin.x;
  const deltaY = pointer.y - origin.y;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance <= LURE_RANGE) {
    return { x: pointer.x, y: pointer.y };
  }
  const factor = LURE_RANGE / distance;
  return {
    x: origin.x + deltaX * factor,
    y: origin.y + deltaY * factor,
  };
}

export function deployLure(
  state: LureState,
  origin: Vector2,
  pointer: Vector2,
  nowMs: number,
): DeployResult {
  if (state.charges <= 0) {
    return { deployed: false, state, reason: "no-charges" };
  }
  if (lureCooldownRemainingMs(state, nowMs) > 0) {
    return { deployed: false, state, reason: "cooldown" };
  }
  return {
    deployed: true,
    state: { charges: state.charges - 1, lastDeployAtMs: nowMs },
    position: lurePosition(origin, pointer),
  };
}
