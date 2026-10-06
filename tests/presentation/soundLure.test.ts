import { describe, expect, it } from "vitest";
import {
  LURE_COOLDOWN_MS,
  LURE_MAX_CHARGES,
  LURE_RANGE,
  canDeploy,
  deployLure,
  initialLureState,
  lureCooldownRemainingMs,
  lurePosition,
  lureStatus,
} from "../../src/game/presentation/soundLure";

const ORIGIN = { x: 100, y: 100 };
const POINTER = { x: 400, y: 100 };

describe("lure resources", () => {
  it("starts with three charges and no cooldown", () => {
    const state = initialLureState();
    expect(state.charges).toBe(LURE_MAX_CHARGES);
    expect(lureCooldownRemainingMs(state, 0)).toBe(0);
    expect(canDeploy(state, 0)).toBe(true);
  });

  it("consumes exactly one charge per deployment (C1)", () => {
    const result = deployLure(initialLureState(), ORIGIN, POINTER, 1000);
    expect(result.deployed).toBe(true);
    if (result.deployed) {
      expect(result.state.charges).toBe(LURE_MAX_CHARGES - 1);
      expect(result.state.lastDeployAtMs).toBe(1000);
    }
  });

  it("blocks deployments during the cooldown and releases after it (C4)", () => {
    const first = deployLure(initialLureState(), ORIGIN, POINTER, 1000);
    expect(first.deployed).toBe(true);
    if (!first.deployed) {
      return;
    }

    expect(canDeploy(first.state, 1000 + LURE_COOLDOWN_MS - 1)).toBe(false);
    expect(canDeploy(first.state, 1000 + LURE_COOLDOWN_MS)).toBe(true);
    expect(lureCooldownRemainingMs(first.state, 1000 + LURE_COOLDOWN_MS)).toBe(0);

    const blocked = deployLure(first.state, ORIGIN, POINTER, 2000);
    expect(blocked.deployed).toBe(false);
    if (!blocked.deployed) {
      expect(blocked.reason).toBe("cooldown");
      expect(blocked.state.charges).toBe(LURE_MAX_CHARGES - 1);
    }
  });

  it("blocks deployments without charges (C1)", () => {
    const empty = { charges: 0, lastDeployAtMs: null };
    expect(canDeploy(empty, 0)).toBe(false);
    const result = deployLure(empty, ORIGIN, POINTER, 0);
    expect(result.deployed).toBe(false);
    if (!result.deployed) {
      expect(result.reason).toBe("no-charges");
    }
  });

  it("exposes a status for the HUD (C4)", () => {
    const first = deployLure(initialLureState(), ORIGIN, POINTER, 1000);
    if (!first.deployed) {
      throw new Error("expected deployment");
    }
    const status = lureStatus(first.state, 1000 + 2500);
    expect(status.charges).toBe(LURE_MAX_CHARGES - 1);
    expect(status.cooldownRemainingMs).toBe(LURE_COOLDOWN_MS - 2500);
    expect(status.ready).toBe(false);
  });
});

describe("lure placement", () => {
  it("places the lure at the pointer when within range (C2)", () => {
    expect(lurePosition(ORIGIN, { x: 180, y: 130 })).toEqual({ x: 180, y: 130 });
  });

  it("clamps the lure to the maximum range in the pointer direction (C2)", () => {
    const position = lurePosition(ORIGIN, POINTER);
    const distance = Math.hypot(position.x - ORIGIN.x, position.y - ORIGIN.y);
    expect(distance).toBeCloseTo(LURE_RANGE, 5);
    expect(position.y).toBeCloseTo(100, 5);
  });

  it("places the lure on the player when the pointer overlaps", () => {
    expect(lurePosition(ORIGIN, ORIGIN)).toEqual(ORIGIN);
  });

  it("rejects non-finite positions", () => {
    expect(() => lurePosition(ORIGIN, { x: Number.NaN, y: 0 })).toThrow();
    expect(() => lurePosition({ x: Number.POSITIVE_INFINITY, y: 0 }, POINTER)).toThrow();
  });
});
