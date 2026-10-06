import Phaser from "phaser";
import {
  DOOR_CELL,
  GUARD_START,
  GRID_HEIGHT,
  GRID_WIDTH,
  PLAYER_START,
  TILE_SIZE,
  labMapWithDoor,
} from "../../application/simulation/labLevel";
import { calculateRoute } from "../../application/simulation/navigationDemo";
import {
  initialPerceptionState,
  updatePerceptionSimulation,
  withSoundEvent,
  type PerceptionSimulationState,
} from "../../application/simulation/perceptionSimulation";
import { cellCenter, isWalkable, worldToCell, type GridPoint } from "../../domain/model/grid";
import type { Vector2 } from "../../domain/model/vector";
import { advanceAlongPath } from "../../domain/navigation/pathFollower";
import type { SearchAlgorithm, SearchResult, SearchStatus } from "../../domain/navigation/search";
import { timeSinceLastPerception } from "../../domain/perception/memory";
import type { VisionReason, VisionResult } from "../../domain/perception/perception";
import { visionConeAppearance } from "../presentation/visionCone";
import {
  ALERT_FLASH_MS,
  ALERT_SHAKE_INTENSITY,
  ALERT_SHAKE_MS,
  alertPhase,
  zoomDuringAlert,
} from "../presentation/alertFeedback";
import {
  advanceTension,
  initialTensionState,
  tensionScroll,
  tensionZoom,
  type TensionState,
} from "../presentation/cameraTension";
import {
  LURE_DURATION_MS,
  LURE_RADIUS,
  deployLure,
  initialLureState,
  lureStatus,
  type LureState,
} from "../presentation/soundLure";

const PLAYER_SPEED = 190;
const GUARD_SPEED = 115;
const VISION_RANGE = 220;
const FIELD_OF_VIEW = Math.PI / 2;
const SOUND_RADIUS = 190;
const SOUND_DURATION_MS = 800;
const STATUS_LABELS: Readonly<Record<SearchStatus, string>> = {
  success: "EXITO",
  unreachable: "INALCANZABLE",
  "invalid-start": "INICIO INVALIDO",
  "invalid-goal": "DESTINO INVALIDO",
};
const VISION_LABELS: Readonly<Record<VisionReason, string>> = {
  visible: "VISIBLE",
  "out-of-range": "FUERA DE RANGO",
  "outside-cone": "FUERA DEL CONO",
  occluded: "OCLUIDO",
  "invalid-facing": "DIRECCION INVALIDA",
};
const BASE_SCROLL = { x: 0, y: 0 };

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private guard!: Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveUp!: Phaser.Input.Keyboard.Key;
  private moveDown!: Phaser.Input.Keyboard.Key;
  private moveLeft!: Phaser.Input.Keyboard.Key;
  private moveRight!: Phaser.Input.Keyboard.Key;
  private reset!: Phaser.Input.Keyboard.Key;
  private toggleAlgorithm!: Phaser.Input.Keyboard.Key;
  private emitSound!: Phaser.Input.Keyboard.Key;
  private deployLureKey!: Phaser.Input.Keyboard.Key;
  private navigationGraphics!: Phaser.GameObjects.Graphics;
  private perceptionGraphics!: Phaser.GameObjects.Graphics;
  private targetMarker!: Phaser.GameObjects.Arc;
  private lastKnownMarker!: Phaser.GameObjects.Arc;
  private navigationHud!: Phaser.GameObjects.Text;
  private navigationAlgorithm: SearchAlgorithm = "astar";
  private navigationGoal: GridPoint = GUARD_START;
  private navigationSummary: readonly string[] = [];
  private guardFacing: Vector2 = { x: -1, y: 0 };
  private guardWaypoints: readonly Vector2[] = [];
  private nextWaypoint = 0;
  private perceptionState: PerceptionSimulationState = initialPerceptionState();
  private visionVisible = false;
  private visionPreviousVisible = false;
  private visionChangedAtMs = 0;
  private alertStartedAtMs: number | null = null;
  private tensionState: TensionState = initialTensionState();
  private lureState: LureState = initialLureState();
  private lureHud!: Phaser.GameObjects.Text;
  private doorOpen = false;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private doorMarker!: Phaser.GameObjects.Arc;

  public constructor() {
    super("GameScene");
  }

  public create(): void {
    this.navigationAlgorithm = "astar";
    this.navigationGoal = GUARD_START;
    this.guardFacing = { x: -1, y: 0 };
    this.guardWaypoints = [];
    this.nextWaypoint = 0;
    this.perceptionState = initialPerceptionState();
    this.visionVisible = false;
    this.visionPreviousVisible = false;
    this.visionChangedAtMs = 0;
    this.alertStartedAtMs = null;
    this.tensionState = initialTensionState();
    this.lureState = initialLureState();
    this.doorOpen = false;
    this.cameras.main.setBackgroundColor("#10161c");
    this.cameras.main.resetFX();
    this.cameras.main.setZoom(1);
    this.cameras.main.setScroll(BASE_SCROLL.x, BASE_SCROLL.y);
    this.drawGrid();

    if (this.walls) {
      this.walls.destroy(true);
    }
    this.walls = this.physics.add.staticGroup();
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        if (!isWalkable(labMapWithDoor(this.doorOpen), { x, y })) {
          const center = cellCenter({ x, y }, TILE_SIZE);
          const wall = this.add.rectangle(center.x, center.y, TILE_SIZE, TILE_SIZE, 0x27333d);
          wall.setStrokeStyle(1, 0x3a4c58);
          this.walls.add(wall);
        }
      }
    }

    const spawn = cellCenter(PLAYER_START, TILE_SIZE);
    this.player = this.add.rectangle(spawn.x, spawn.y, 20, 20, 0xe5b454);
    this.player.setStrokeStyle(2, 0xffd98a);
    this.player.setDepth(4);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    this.cursors = keyboard.createCursorKeys();
    this.moveUp = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.moveDown = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.moveLeft = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.moveRight = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.reset = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.toggleAlgorithm = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.emitSound = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.deployLureKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.perceptionGraphics = this.add.graphics().setDepth(1);
    this.navigationGraphics = this.add.graphics().setDepth(2);
    const guardPosition = cellCenter(GUARD_START, TILE_SIZE);
    this.guard = this.add
      .circle(guardPosition.x, guardPosition.y, 11, 0x6b8afd)
      .setStrokeStyle(2, 0xb9c5ff)
      .setDepth(4);
    this.targetMarker = this.add
      .circle(0, 0, 10, 0x000000, 0)
      .setStrokeStyle(3, 0x73c991)
      .setDepth(5);
    this.lastKnownMarker = this.add
      .circle(0, 0, 7, 0x000000, 0)
      .setStrokeStyle(2, 0xe16969)
      .setDepth(5)
      .setVisible(false);

    this.add
      .text(16, 14, "H3 / PERCEPCION Y MOVIMIENTO", {
        color: "#9eb4c2",
        fontFamily: "monospace",
        fontSize: "14px",
      })
      .setDepth(10);

    this.navigationHud = this.add
      .text(GRID_WIDTH * TILE_SIZE - 16, 14, "", {
        align: "right",
        backgroundColor: "#10161ccc",
        color: "#d9e4ea",
        fontFamily: "monospace",
        fontSize: "13px",
        padding: { x: 8, y: 6 },
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.lureHud = this.add
      .text(16, GRID_HEIGHT * TILE_SIZE - 14, "", {
        backgroundColor: "#10161ccc",
        color: "#d9e4ea",
        fontFamily: "monospace",
        fontSize: "13px",
        padding: { x: 8, y: 6 },
      })
      .setOrigin(0, 1)
      .setDepth(10);

    const doorPos = cellCenter(DOOR_CELL, TILE_SIZE);
    this.doorMarker = this.add
      .circle(doorPos.x, doorPos.y, 8, 0x000000, 0)
      .setStrokeStyle(3, 0xe5b454)
      .setDepth(5);

    this.input.on("pointerdown", this.handlePointerDown, this);
    this.renderNavigation();
    this.updatePerception(0);
    this.updateLureHud(0);
  }

  public update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.reset)) {
      this.scene.restart();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.toggleAlgorithm)) {
      this.navigationAlgorithm = this.navigationAlgorithm === "astar" ? "bfs" : "astar";
      this.renderNavigation();
    }

    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F))) {
      const doorPos = cellCenter(DOOR_CELL, TILE_SIZE);
      const dx = Math.abs(this.player.x - doorPos.x);
      const dy = Math.abs(this.player.y - doorPos.y);
      const manhattan = Math.floor(dx / TILE_SIZE + 0.5) + Math.floor(dy / TILE_SIZE + 0.5);
      const playerCell = worldToCell({ x: this.player.x, y: this.player.y }, TILE_SIZE);
      const onDoor = playerCell.x === DOOR_CELL.x && playerCell.y === DOOR_CELL.y;
      if (manhattan <= 1 && !onDoor) {
        this.doorOpen = !this.doorOpen;
        this.rebuildWalls();
        this.renderNavigation();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.emitSound)) {
      this.perceptionState = withSoundEvent(this.perceptionState, {
        position: { x: this.player.x, y: this.player.y },
        radius: SOUND_RADIUS,
        emittedAtMs: time,
        durationMs: SOUND_DURATION_MS,
      });
    }

    if (Phaser.Input.Keyboard.JustDown(this.deployLureKey)) {
      const pointer = this.input.activePointer;
      const result = deployLure(
        this.lureState,
        { x: this.player.x, y: this.player.y },
        { x: pointer.worldX, y: pointer.worldY },
        time,
      );
      if (result.deployed) {
        this.lureState = result.state;
        this.perceptionState = withSoundEvent(this.perceptionState, {
          position: result.position,
          radius: LURE_RADIUS,
          emittedAtMs: time,
          durationMs: LURE_DURATION_MS,
        });
      }
    }

    const horizontal = Number(this.cursors.right.isDown || this.moveRight.isDown)
      - Number(this.cursors.left.isDown || this.moveLeft.isDown);
    const vertical = Number(this.cursors.down.isDown || this.moveDown.isDown)
      - Number(this.cursors.up.isDown || this.moveUp.isDown);
    const velocity = new Phaser.Math.Vector2(horizontal, vertical);

    if (velocity.lengthSq() > 0) {
      velocity.normalize().scale(PLAYER_SPEED);
    }

    this.playerBody.setVelocity(velocity.x, velocity.y);
    this.updateGuardMovement(delta);
    this.updatePerception(time);
    this.updateCamera(time, delta);
    this.updateLureHud(time);
  }

  private updateLureHud(time: number): void {
    const status = lureStatus(this.lureState, time);
    const readiness = status.cooldownRemainingMs > 0
      ? `ENFRIANDO ${(status.cooldownRemainingMs / 1000).toFixed(1)}S`
      : "LISTO";
    this.lureHud.setText(`SENUELOS ${status.charges} ${readiness}`);
  }

  private rebuildWalls(): void {
    if (this.walls) {
      this.walls.destroy(true);
    }
    this.walls = this.physics.add.staticGroup();
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        if (!isWalkable(labMapWithDoor(this.doorOpen), { x, y })) {
          const center = cellCenter({ x, y }, TILE_SIZE);
          const wall = this.add.rectangle(center.x, center.y, TILE_SIZE, TILE_SIZE, 0x27333d);
          wall.setStrokeStyle(1, 0x3a4c58);
          this.walls.add(wall);
        }
      }
    }
    if (this.playerBody) {
      this.physics.add.collider(this.player, this.walls);
    }
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1b252d, 1);

    for (let x = 0; x <= GRID_WIDTH; x += 1) {
      graphics.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
    }
    for (let y = 0; y <= GRID_HEIGHT; y += 1) {
      graphics.lineBetween(0, y * TILE_SIZE, GRID_WIDTH * TILE_SIZE, y * TILE_SIZE);
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.navigationGoal = worldToCell({ x: pointer.worldX, y: pointer.worldY }, TILE_SIZE);
    this.renderNavigation();
  }

  private renderNavigation(): void {
    const guardCell = worldToCell({ x: this.guard.x, y: this.guard.y }, TILE_SIZE);
    const result = calculateRoute(
      labMapWithDoor(this.doorOpen),
      guardCell,
      this.navigationGoal,
      this.navigationAlgorithm,
    );
    this.drawSearchResult(result);
    this.guardWaypoints = result.status === "success"
      ? result.path.map((point) => cellCenter(point, TILE_SIZE))
      : [];
    this.nextWaypoint = 0;

    const targetPosition = cellCenter(this.navigationGoal, TILE_SIZE);
    this.targetMarker.setPosition(targetPosition.x, targetPosition.y);
    this.targetMarker.setStrokeStyle(3, result.status === "success" ? 0x73c991 : 0xe16969);

    const cost = result.totalCost === null ? "-" : String(result.totalCost);
    const algorithm = result.algorithm === "astar" ? "A*" : "BFS";
    this.navigationSummary = [
      `${algorithm} / ${STATUS_LABELS[result.status]}`,
      `costo ${cost} | expandidos ${result.expandedNodes}`,
      `frontera maxima ${result.maximumFrontier}`,
    ];
  }

  private drawSearchResult(result: SearchResult): void {
    this.navigationGraphics.clear();
    this.navigationGraphics.fillStyle(0x3b819c, 0.22);
    for (const point of result.explored) {
      this.navigationGraphics.fillRect(
        point.x * TILE_SIZE + 3,
        point.y * TILE_SIZE + 3,
        TILE_SIZE - 6,
        TILE_SIZE - 6,
      );
    }

    const firstPoint = result.path[0];
    if (!firstPoint) {
      return;
    }

    const firstCenter = cellCenter(firstPoint, TILE_SIZE);
    this.navigationGraphics.lineStyle(4, 0x62d0e8, 0.9);
    this.navigationGraphics.beginPath();
    this.navigationGraphics.moveTo(firstCenter.x, firstCenter.y);
    for (const point of result.path.slice(1)) {
      const center = cellCenter(point, TILE_SIZE);
      this.navigationGraphics.lineTo(center.x, center.y);
    }
    this.navigationGraphics.strokePath();
  }

  private updateGuardMovement(delta: number): void {
    const previous = { x: this.guard.x, y: this.guard.y };
    const movement = advanceAlongPath(
      previous,
      this.guardWaypoints,
      this.nextWaypoint,
      GUARD_SPEED * delta / 1000,
    );
    this.nextWaypoint = movement.nextWaypoint;
    this.guard.setPosition(movement.position.x, movement.position.y);

    if (movement.direction) {
      this.guardFacing = movement.direction;
    }
  }

  private updatePerception(time: number): void {
    const perception = updatePerceptionSimulation(this.perceptionState, {
      map: labMapWithDoor(this.doorOpen),
      tileSize: TILE_SIZE,
      observer: { x: this.guard.x, y: this.guard.y },
      facing: this.guardFacing,
      target: { x: this.player.x, y: this.player.y },
      visionRange: VISION_RANGE,
      fieldOfViewRadians: FIELD_OF_VIEW,
      timeMs: time,
    });
    this.perceptionState = perception.state;

    if (perception.vision.visible !== this.visionVisible) {
      this.visionPreviousVisible = this.visionVisible;
      this.visionVisible = perception.vision.visible;
      this.visionChangedAtMs = time;
      if (perception.vision.visible) {
        this.alertStartedAtMs = time;
        this.cameras.main.shake(ALERT_SHAKE_MS, ALERT_SHAKE_INTENSITY);
        this.cameras.main.flash(ALERT_FLASH_MS, 255, 255, 255);
      }
    }

    this.drawPerception(time);
    this.updateTelemetry(time, perception.vision, perception.soundHeard);
    this.updateDoorMarker();
  }

  private updateCamera(time: number, delta: number): void {
    this.tensionState = advanceTension(this.tensionState, this.visionVisible, delta);

    const alertStartedAtMs = this.alertStartedAtMs;
    const alertActive = alertStartedAtMs !== null
      && alertPhase(alertStartedAtMs, time).active;

    if (alertActive) {
      this.cameras.main.setZoom(zoomDuringAlert(alertStartedAtMs, time));
    } else {
      this.alertStartedAtMs = null;
      this.cameras.main.setZoom(tensionZoom(this.tensionState.progress));
    }

    const scroll = tensionScroll(
      BASE_SCROLL,
      { x: this.guard.x, y: this.guard.y },
      { x: this.player.x, y: this.player.y },
      this.tensionState.progress,
    );
    this.cameras.main.setScroll(scroll.x, scroll.y);
  }

  private updateDoorMarker(): void {
    const doorPos = cellCenter(DOOR_CELL, TILE_SIZE);
    this.doorMarker.setPosition(doorPos.x, doorPos.y);
    this.doorMarker.setStrokeStyle(3, this.doorOpen ? 0x73c991 : 0xe5b454);
  }

  private drawPerception(timeMs: number): void {
    this.perceptionGraphics.clear();
    const facingAngle = Math.atan2(this.guardFacing.y, this.guardFacing.x);
    const halfFieldOfView = FIELD_OF_VIEW / 2;
    const appearance = visionConeAppearance(
      this.visionVisible,
      this.visionPreviousVisible,
      this.visionChangedAtMs,
      timeMs,
    );
    this.perceptionGraphics.fillStyle(appearance.fill, appearance.alpha);
    this.perceptionGraphics.beginPath();
    this.perceptionGraphics.moveTo(this.guard.x, this.guard.y);
    this.perceptionGraphics.arc(
      this.guard.x,
      this.guard.y,
      VISION_RANGE,
      facingAngle - halfFieldOfView,
      facingAngle + halfFieldOfView,
    );
    this.perceptionGraphics.closePath();
    this.perceptionGraphics.fillPath();
    this.perceptionGraphics.lineStyle(2, 0xd7e1ff, 0.9);
    this.perceptionGraphics.strokePath();

    if (this.perceptionState.soundEvent) {
      this.perceptionGraphics.lineStyle(2, 0xe5b454, 0.8);
      this.perceptionGraphics.strokeCircle(
        this.perceptionState.soundEvent.position.x,
        this.perceptionState.soundEvent.position.y,
        this.perceptionState.soundEvent.radius,
      );
    }

    const lastKnown = this.perceptionState.memory.lastKnownPosition;
    this.lastKnownMarker.setVisible(lastKnown !== null);
    if (lastKnown) {
      this.lastKnownMarker.setPosition(lastKnown.x, lastKnown.y);
    }
  }

  private updateTelemetry(time: number, vision: VisionResult, soundHeard: boolean): void {
    const age = timeSinceLastPerception(this.perceptionState.memory, time);
    const memory = age === null
      ? "memoria -"
      : `memoria ${this.perceptionState.memory.source} ${(age / 1000).toFixed(1)}s`;
    const sound = this.perceptionState.soundEvent
      ? (soundHeard ? "OIDO" : "FUERA DE RANGO")
      : "-";

    this.navigationHud.setText([
      ...this.navigationSummary,
      `vision ${VISION_LABELS[vision.reason]}`,
      `sonido ${sound}`,
      memory,
      `PUERTA ${this.doorOpen ? "ABIERTA" : "CERRADA"}`,
    ]);
  }
}
