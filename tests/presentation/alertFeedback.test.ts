import { describe, expect, it } from "vitest";
import {
  ALERT_TOTAL_MS,
  ALERT_ZOOM_PEAK,
  alertPhase,
  zoomDuringAlert,
} from "../../src/game/presentation/alertFeedback";

describe("alert phase", () => {
  it("completes in less than one second", () => {
    expect(ALERT_TOTAL_MS).toBeLessThan(1000);
  });

  it("starts active at the moment of detection", () => {
    const phase = alertPhase(1000, 1000);
    expect(phase.active).toBe(true);
    expect(phase.progress).toBe(0);
  });

  it("grows until the alert duration elapses", () => {
    const half = ALERT_TOTAL_MS / 2;
    expect(alertPhase(1000, 1000 + half).progress).toBeCloseTo(0.5, 5);
    const finished = alertPhase(1000, 1000 + ALERT_TOTAL_MS);
    expect(finished.active).toBe(false);
    expect(finished.progress).toBe(1);
  });

  it("stays inactive after the alert duration", () => {
    const phase = alertPhase(1000, 1000 + ALERT_TOTAL_MS + 5000);
    expect(phase.active).toBe(false);
    expect(phase.progress).toBe(1);
  });

  it("clamps elapsed time below zero", () => {
    const phase = alertPhase(1000, 500);
    expect(phase.progress).toBe(0);
    expect(phase.active).toBe(true);
  });

  it("rejects non-finite timestamps", () => {
    expect(() => alertPhase(Number.NaN, 0)).toThrow();
    expect(() => alertPhase(0, Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe("zoom during alert", () => {
  it("returns to resting zoom once the alert completed", () => {
    const settled = zoomDuringAlert(2000, 2000 + ALERT_TOTAL_MS);
    expect(settled).toBe(1);
  });

  it("keeps resting zoom outside the alert window", () => {
    expect(zoomDuringAlert(2000, 5000)).toBe(1);
  });

  it("peaks at the midpoint of the alert", () => {
    const peak = zoomDuringAlert(2000, 2000 + ALERT_TOTAL_MS / 2);
    expect(peak).toBeCloseTo(1 + ALERT_ZOOM_PEAK, 5);
  });

  it("is symmetric: same value before and after the midpoint", () => {
    const quarter = ALERT_TOTAL_MS / 4;
    const before = zoomDuringAlert(2000, 2000 + quarter);
    const after = zoomDuringAlert(2000, 2000 + ALERT_TOTAL_MS - quarter);
    expect(before).toBeCloseTo(after, 5);
  });

  it("starts and ends at resting zoom", () => {
    expect(zoomDuringAlert(2000, 2000)).toBe(1);
    expect(zoomDuringAlert(2000, 2000 + ALERT_TOTAL_MS)).toBe(1);
  });
});
