import { describe, expect, it } from "vitest";
import { DOOR_CELL, labMapWithDoor } from "../../src/application/simulation/labLevel";
import { isWalkable } from "../../src/domain/model/grid";

describe("lab level door", () => {
  it("keeps the door closed by default", () => {
    expect(DOOR_CELL).toEqual({ x: 19, y: 7 });
  });

  it("blocks the door when closed and opens it when open (C2)", () => {
    const closed = labMapWithDoor(false);
    const open = labMapWithDoor(true);
    expect(isWalkable(closed, DOOR_CELL)).toBe(false);
    expect(isWalkable(open, DOOR_CELL)).toBe(true);
  });

  it("preserves the rest of the blocked areas when toggling", () => {
    const closed = labMapWithDoor(false);
    const open = labMapWithDoor(true);
    expect(isWalkable(closed, { x: 4, y: 3 })).toBe(false);
    expect(isWalkable(open, { x: 4, y: 3 })).toBe(false);
    expect(isWalkable(closed, { x: 0, y: 0 })).toBe(false);
    expect(isWalkable(open, { x: 0, y: 0 })).toBe(false);
    expect(isWalkable(closed, { x: 2, y: 2 })).toBe(true);
    expect(isWalkable(open, { x: 2, y: 2 })).toBe(true);
  });
});
