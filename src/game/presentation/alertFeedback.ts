export const ALERT_SHAKE_MS = 400;
export const ALERT_SHAKE_INTENSITY = 0.01;
export const ALERT_FLASH_MS = 250;
export const ALERT_ZOOM_MS = 700;
export const ALERT_ZOOM_PEAK = 0.06;
export const ALERT_TOTAL_MS = Math.max(ALERT_SHAKE_MS, ALERT_FLASH_MS, ALERT_ZOOM_MS);

export interface AlertPhase {
  readonly active: boolean;
  readonly progress: number;
}

export function alertPhase(changedAtMs: number, nowMs: number): AlertPhase {
  if (!Number.isFinite(changedAtMs) || !Number.isFinite(nowMs)) {
    throw new Error("Alert timestamps must be finite.");
  }
  if (ALERT_TOTAL_MS <= 0) {
    return { active: false, progress: 1 };
  }
  const elapsed = nowMs - changedAtMs;
  if (elapsed <= 0) {
    return { active: true, progress: 0 };
  }
  if (elapsed >= ALERT_TOTAL_MS) {
    return { active: false, progress: 1 };
  }
  return { active: true, progress: elapsed / ALERT_TOTAL_MS };
}

export function zoomDuringAlert(changedAtMs: number, nowMs: number): number {
  const phase = alertPhase(changedAtMs, nowMs);
  if (!phase.active) {
    return 1;
  }
  const triangular = 1 - Math.abs(2 * phase.progress - 1);
  return 1 + ALERT_ZOOM_PEAK * triangular;
}
