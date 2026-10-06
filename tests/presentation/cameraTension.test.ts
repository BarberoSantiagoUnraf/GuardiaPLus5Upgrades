import { describe, expect, it } from "vitest";
import {
  TENSION_RETURN_DELAY_MS,
  TENSION_RETURN_MS,
  TENSION_IN_MS,
  TENSION_ZOOM,
  advanceTension,
  initialTensionState,
  tensionScroll,
  tensionZoom,
} from "../../src/game/presentation/cameraTension";

function advance(
  state: ReturnType<typeof initialTensionState>,
  visible: boolean,
  deltas: readonly number[],
): ReturnType<typeof initialTensionState> {
  return deltas.reduce(
    (current, delta) => advanceTension(current, visible, delta),
    state,
  );
}

describe("tension phases", () => {
  it("starts at base with zero progress", () => {
    const state = initialTensionState();
    expect(state.phase).toBe("base");
    expect(state.progress).toBe(0);
  });

  it("stays at base while the player is not visible", () => {
    const state = advance(initialTensionState(), false, [16, 16, 100]);
    expect(state.phase).toBe("base");
    expect(state.progress).toBe(0);
  });

  it("reaches full tension within the entrance duration (C1)", () => {
    const state = advance(initialTensionState(), true, [TENSION_IN_MS]);
    expect(state.progress).toBeGreaterThanOrEqual(0.95);
    expect(state.phase).toBe("holding");
  });

  it("grows linearly during the entrance", () => {
    const state = advance(initialTensionState(), true, [TENSION_IN_MS / 2]);
    expect(state.progress).toBeCloseTo(0.5, 5);
    expect(state.phase).toBe("entering");
  });

  it("holds full tension while visibility persists", () => {
    const state = advance(initialTensionState(), true, [TENSION_IN_MS, 1000, 1000]);
    expect(state.progress).toBe(1);
    expect(state.phase).toBe("holding");
  });

  it("waits the grace period before returning (C2)", () => {
    const tense = advance(initialTensionState(), true, [TENSION_IN_MS]);
    const almost = advance(tense, false, [TENSION_RETURN_DELAY_MS - 1]);
    expect(almost.phase).toBe("grace");
    const startingReturn = advance(tense, false, [TENSION_RETURN_DELAY_MS]);
    expect(startingReturn.phase).toBe("returning");
  });

  it("returns to base within the return duration after the grace (C2)", () => {
    const tense = advance(initialTensionState(), true, [TENSION_IN_MS]);
    const returning = advance(tense, false, [TENSION_RETURN_DELAY_MS]);
    const settled = advance(returning, false, [TENSION_RETURN_MS]);
    expect(settled.phase).toBe("base");
    expect(settled.progress).toBe(0);
  });

  it("cancels the return when visibility is regained during the grace", () => {
    const tense = advance(initialTensionState(), true, [TENSION_IN_MS]);
    const inGrace = advance(tense, false, [300]);
    expect(inGrace.phase).toBe("grace");
    const resumed = advance(inGrace, true, [16]);
    expect(resumed.phase).toBe("holding");
    expect(resumed.progress).toBe(1);
  });

  it("keeps the current progress when visibility flaps during the entrance", () => {
    const partial = advance(initialTensionState(), true, [200]);
    expect(partial.progress).toBeCloseTo(0.4, 5);
    const flapped = advance(partial, false, [100]);
    expect(flapped.phase).toBe("grace");
    expect(flapped.progress).toBeCloseTo(0.4, 5);
    const resumed = advance(flapped, true, [100]);
    expect(resumed.phase).toBe("entering");
    expect(resumed.progress).toBeCloseTo(0.6, 5);
  });

  it("resumes the entrance from the current position during a return", () => {
    const tense = advance(initialTensionState(), true, [TENSION_IN_MS]);
    const startingReturn = advance(tense, false, [TENSION_RETURN_DELAY_MS]);
    const returning = advance(startingReturn, false, [500]);
    expect(returning.phase).toBe("returning");
    expect(returning.progress).toBeCloseTo(0.5, 5);
    const resumed = advance(returning, true, [100]);
    expect(resumed.phase).toBe("entering");
    expect(resumed.progress).toBeCloseTo(0.7, 5);
  });

  it("rejects invalid deltas", () => {
    expect(() => advanceTension(initialTensionState(), true, -1)).toThrow();
    expect(() => advanceTension(initialTensionState(), true, Number.NaN)).toThrow();
  });
});

describe("tension zoom", () => {
  it("goes from resting zoom to tension zoom", () => {
    expect(tensionZoom(0)).toBe(1);
    expect(tensionZoom(1)).toBeCloseTo(TENSION_ZOOM, 5);
    expect(tensionZoom(0.5)).toBeCloseTo((1 + TENSION_ZOOM) / 2, 5);
  });

  it("clamps progress outside the unit interval", () => {
    expect(tensionZoom(-1)).toBe(1);
    expect(tensionZoom(2)).toBeCloseTo(TENSION_ZOOM, 5);
  });
});

describe("tension scroll", () => {
  const base = { x: 0, y: 0 };
  const guard = { x: 100, y: 40 };
  const player = { x: 300, y: 80 };

  it("keeps the base scroll without tension", () => {
    expect(tensionScroll(base, guard, player, 0)).toEqual(base);
  });

  it("centers between guard and player at full tension", () => {
    const scroll = tensionScroll(base, guard, player, 1);
    expect(scroll).toEqual({ x: 200, y: 60 });
  });

  it("interpolates linearly between base and center", () => {
    const scroll = tensionScroll(base, guard, player, 0.5);
    expect(scroll).toEqual({ x: 100, y: 30 });
  });
});
