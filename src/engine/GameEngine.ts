import { randomUUID } from 'node:crypto';

import {
  boardRoleIds,
  validateBoard,
  type BoardDefinition,
} from '../boards/BoardDefinition.js';
import type { PlayerController, PlayerContext } from '../controller/PlayerController.js';
import type { Action } from '../domain/action.js';
import type { GameEvent } from '../domain/event.js';
import type { Faction } from '../domain/faction.js';
import type { Phase } from '../domain/phase.js';
import type {
  Player,
  PlayerState,
  PlayerView,
  PublicPlayer,
} from '../domain/player.js';
import { getRole } from '../roles/index.js';
import {
  admitAction,
  drainActions as drainQueuedActions,
  type ActionAdmission,
} from './ActionResolver.js';
import {
  appendEvent,
  createGameState,
  requirePlayer,
  type GameState,
} from './GameState.js';
import { advance as advancePhase } from './PhaseMachine.js';
import { checkVictory } from './VictoryChecker.js';

/**
 * Player seats are 1-based and ids follow architecture §9's examples
 * (`actor: "player5"`), so a seat and its id are always derivable from one
 * another.
 */
export function playerIdForSeat(seat: number): string {
  return `player${seat}`;
}

export interface CreateGameOptions {
  readonly id?: string;
  readonly board: BoardDefinition;
  /**
   * Controllers to bind up front. Optional because Phase 0 ships no controller
   * implementation; Phase 1 passes a RandomController per seat.
   */
  readonly controllers?: ReadonlyMap<string, PlayerController>;
}

/**
 * GameEngine — the rule layer and the only entry point to game truth
 * (architecture §1, §6, §7, §11).
 *
 * Responsibilities in Phase 0:
 *   - build a GameState from a board (§6, §12);
 *   - hand out PlayerViews and PlayerContexts, which is how information
 *     isolation (§7) is enforced: nothing else leaves this class;
 *   - accept actions (§9) through ActionResolver;
 *   - drive the phase machine (§8) and settle victory (§6).
 *
 * It deliberately does NOT: assign roles randomly (Phase 1 draws a random
 * seat order), run turns against controllers (Phase 1), or resolve action
 * effects (Phase 1). There is also no `run()` yet, because with no effect rules
 * and no controllers a loop would spin without ever changing state.
 */
export class GameEngine {
  private readonly gameState: GameState;
  private readonly controllers: Map<string, PlayerController>;

  private constructor(
    gameState: GameState,
    controllers: Map<string, PlayerController>,
  ) {
    this.gameState = gameState;
    this.controllers = controllers;
  }

  /**
   * Create a game from a board.
   *
   * Roles are dealt in the board's listed order. Shuffling seats is a
   * randomness concern that arrives with the Phase 1 RandomController, so a
   * game created here is fully deterministic and therefore testable.
   */
  static create(options: CreateGameOptions): GameEngine {
    const { board } = options;
    validateBoard(board);

    const roleIds = boardRoleIds(board);
    const players: PlayerState[] = roleIds.map((roleId, index) => ({
      id: playerIdForSeat(index + 1),
      seat: index + 1,
      roleId,
      alive: true,
    }));

    const gameState = createGameState({
      id: options.id ?? randomUUID(),
      board: board.id,
      players,
    });

    appendEvent(gameState, {
      type: 'game_created',
      visibility: 'public',
      payload: { board: board.id, seats: players.length },
    });

    return new GameEngine(gameState, new Map(options.controllers ?? []));
  }

  /**
   * The game's truth, for the engine, the UI and storage (§6).
   *
   * Mutating it outside the engine is a bug, but the boundary that actually
   * matters is §7: controllers and Observers are never handed this object, they
   * get `createView`. Phase 0 does not wrap it in a deep-copying façade — that
   * would be an abstraction with no requirement behind it yet.
   */
  get state(): GameState {
    return this.gameState;
  }

  get id(): string {
    return this.gameState.id;
  }

  get phase(): Phase {
    return this.gameState.phase;
  }

  get round(): number {
    return this.gameState.round;
  }

  get winner(): Faction | undefined {
    return this.gameState.winner;
  }

  /**
   * Build the view for one player or Observer (architecture §7).
   *
   * The view is a detached snapshot: it holds no reference to GameState, no
   * other player's role, and no `god` event. This is the only sanctioned way
   * for a decision-maker to learn anything about the game.
   */
  createView(playerId: string): PlayerView {
    const state = this.gameState;
    const self = requirePlayer(state, playerId);
    const role = getRole(self.roleId);

    const players: PublicPlayer[] = state.players.map((player) => ({
      id: player.id,
      seat: player.seat,
      alive: player.alive,
    }));

    // Wolves know each other for the whole game, including after death.
    const teammates =
      role.faction === 'wolf'
        ? state.players
            .filter(
              (player) =>
                player.id !== self.id &&
                getRole(player.roleId).faction === 'wolf',
            )
            .map((player) => player.id)
        : [];

    const checkResults: Record<string, Faction> = {};
    const publicEvents: GameEvent[] = [];
    const privateEvents: GameEvent[] = [];

    for (const event of state.events) {
      if (event.visibility === 'public') {
        publicEvents.push(event);
        continue;
      }
      if (
        event.visibility === 'private' &&
        event.to?.includes(playerId) === true
      ) {
        privateEvents.push(event);
        collectCheckResult(event, checkResults);
      }
    }

    return {
      playerId,
      seat: self.seat,
      roleId: role.id,
      faction: role.faction,
      alive: self.alive,
      round: state.round,
      phase: state.phase,
      players,
      teammates,
      checkResults,
      publicEvents,
      privateEvents,
    };
  }

  /** Package a player's view as the controller's decision input (§11). */
  createContext(playerId: string): PlayerContext {
    return { view: this.createView(playerId) };
  }

  /** Attach the controller that decides for a seat. */
  bindController(playerId: string, controller: PlayerController): void {
    requirePlayer(this.gameState, playerId);
    this.controllers.set(playerId, controller);
  }

  /**
   * The runtime Player of §5 — persisted state plus resolved role plus
   * controller. `undefined` when the seat has no controller bound yet; throws
   * for an unknown player id.
   */
  getPlayer(playerId: string): Player | undefined {
    const playerState = requirePlayer(this.gameState, playerId);
    const controller = this.controllers.get(playerId);
    if (controller === undefined) {
      return undefined;
    }
    return {
      id: playerState.id,
      seat: playerState.seat,
      role: getRole(playerState.roleId),
      alive: playerState.alive,
      controller,
    };
  }

  /** Submit an action on behalf of a player (§9). */
  submitAction(action: Action): ActionAdmission {
    return admitAction(this.gameState, action);
  }

  /** Take the actions queued for the current phase and clear the queue. */
  drainActions(): readonly Action[] {
    return drainQueuedActions(this.gameState);
  }

  /**
   * Move to the next phase (§8). Entering WIN_CHECK settles the winner (§6).
   */
  advance(): Phase {
    const phase = advancePhase(this.gameState);

    if (phase === 'WIN_CHECK') {
      const winner = checkVictory(this.gameState);
      if (winner !== undefined) {
        this.gameState.winner = winner;
        appendEvent(this.gameState, {
          type: 'game_ended',
          visibility: 'public',
          payload: { winner },
        });
      }
    }

    return phase;
  }

  isOver(): boolean {
    return (
      this.gameState.winner !== undefined || this.gameState.phase === 'GAME_END'
    );
  }
}

/**
 * Fold a seer's private `check_result` events into the view's `checkResults`
 * map (§7). The payload is read defensively because events are data and an
 * event from a future producer must never be able to corrupt a view.
 */
function collectCheckResult(
  event: GameEvent,
  into: Record<string, Faction>,
): void {
  if (event.type !== 'check_result') {
    return;
  }
  const { target, faction } = event.payload;
  if (
    typeof target === 'string' &&
    (faction === 'wolf' || faction === 'good')
  ) {
    into[target] = faction;
  }
}
