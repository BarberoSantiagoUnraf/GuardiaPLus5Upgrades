export const VISION_CONE_REST_COLOR = 0x6b8afd;
export const VISION_CONE_ALERT_COLOR = 0x73c991;
export const VISION_CONE_BASE_ALPHA = 0.16;
export const VISION_CONE_TRANSITION_MS = 300;

export interface VisionConeAppearance {
  readonly fill: number;
  readonly alpha: number;
}

export function transitionProgress(changedAtMs: number, nowMs: number): number {
  if (!Number.isFinite(changedAtMs) || !Number.isFinite(nowMs)) {
    throw new Error("Transition timestamps must be finite.");
  }
  if (VISION_CONE_TRANSITION_MS <= 0) {
    return 1;
  }
  const elapsed = nowMs - changedAtMs;
  if (elapsed <= 0) {
    return 0;
  }
  if (elapsed >= VISION_CONE_TRANSITION_MS) {
    return 1;
  }
  return elapsed / VISION_CONE_TRANSITION_MS;
}

export function mixColors(from: number, to: number, progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  const channel = (shift: number): number => {
    const start = (from >> shift) & 0xff;
    const end = (to >> shift) & 0xff;
    return Math.round(start + (end - start) * clamped);
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

export function visionConeAppearance(
  visible: boolean,
  previousVisible: boolean,
  changedAtMs: number,
  nowMs: number,
): VisionConeAppearance {
  const target = visible ? VISION_CONE_ALERT_COLOR : VISION_CONE_REST_COLOR;
  if (visible === previousVisible) {
    return { fill: target, alpha: VISION_CONE_BASE_ALPHA };
  }
  const from = visible ? VISION_CONE_REST_COLOR : VISION_CONE_ALERT_COLOR;
  const fill = mixColors(from, target, transitionProgress(changedAtMs, nowMs));
  return { fill, alpha: VISION_CONE_BASE_ALPHA };
}
