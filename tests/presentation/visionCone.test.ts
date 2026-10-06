import { describe, expect, it } from "vitest";
import {
  VISION_CONE_ALERT_COLOR,
  VISION_CONE_BASE_ALPHA,
  VISION_CONE_REST_COLOR,
  VISION_CONE_TRANSITION_MS,
  mixColors,
  transitionProgress,
  visionConeAppearance,
} from "../../src/game/presentation/visionCone";

describe("transition progress", () => {
  it("is zero at the moment the state changes", () => {
    expect(transitionProgress(1000, 1000)).toBe(0);
  });

  it("grows linearly until the transition duration", () => {
    const half = VISION_CONE_TRANSITION_MS / 2;
    expect(transitionProgress(1000, 1000 + half)).toBeCloseTo(0.5, 5);
    expect(transitionProgress(1000, 1000 + VISION_CONE_TRANSITION_MS)).toBe(1);
  });

  it("clamps below zero and above the duration", () => {
    expect(transitionProgress(1000, 900)).toBe(0);
    expect(transitionProgress(1000, 1000 + VISION_CONE_TRANSITION_MS + 500)).toBe(1);
  });

  it("rejects non-finite timestamps", () => {
    expect(() => transitionProgress(Number.NaN, 0)).toThrow();
    expect(() => transitionProgress(0, Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe("mix colors", () => {
  it("returns the origin at zero and the target at one", () => {
    expect(mixColors(0x6b8afd, 0x73c991, 0)).toBe(0x6b8afd);
    expect(mixColors(0x6b8afd, 0x73c991, 1)).toBe(0x73c991);
  });

  it("interpolates each channel at the midpoint", () => {
    expect(mixColors(0x6b8afd, 0x73c991, 0.5)).toBe(0x6faac7);
  });

  it("clamps progress outside the unit interval", () => {
    expect(mixColors(0x6b8afd, 0x73c991, -1)).toBe(0x6b8afd);
    expect(mixColors(0x6b8afd, 0x73c991, 2)).toBe(0x73c991);
  });
});

describe("vision cone appearance", () => {
  it("shows the rest color while the guard does not see the player", () => {
    const appearance = visionConeAppearance(false, false, 0, 10_000);
    expect(appearance.fill).toBe(VISION_CONE_REST_COLOR);
    expect(appearance.alpha).toBe(VISION_CONE_BASE_ALPHA);
  });

  it("shows the alert color once the transition to detection completed", () => {
    const appearance = visionConeAppearance(
      true,
      false,
      1000,
      1000 + VISION_CONE_TRANSITION_MS,
    );
    expect(appearance.fill).toBe(VISION_CONE_ALERT_COLOR);
  });

  it("keeps the rest color at the first frame of a detection", () => {
    const appearance = visionConeAppearance(true, false, 1000, 1000);
    expect(appearance.fill).toBe(VISION_CONE_REST_COLOR);
  });

  it("returns to the rest color within the transition duration after losing the player", () => {
    const changedAt = 5000;
    const settled = visionConeAppearance(
      false,
      true,
      changedAt,
      changedAt + VISION_CONE_TRANSITION_MS,
    );
    expect(settled.fill).toBe(VISION_CONE_REST_COLOR);
  });

  it("does not re-transition when the visible state is unchanged", () => {
    const appearance = visionConeAppearance(true, true, 7000, 7001);
    expect(appearance.fill).toBe(VISION_CONE_ALERT_COLOR);
  });

  it("uses distinct colors for rest and detection", () => {
    expect(VISION_CONE_REST_COLOR).not.toBe(VISION_CONE_ALERT_COLOR);
  });
});
