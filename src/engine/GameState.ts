import type { Action } from '../domain/action.js';
import type { EventType, GameEvent, Visibility } from '../domain/event.js';
import type { Faction } from '../domain/faction.js';
import type { Phase } from '../domain/phase.js';
import type { PlayerState } from '../domain/player.js';

/**
 * GameState — the single source of truth (architecture §6).
 *
 * Nothing else holds game truth: controllers get a PlayerView (§7), the UI and
 * storage read this, and every change to it is recorded as a GameEvent (§10).
 *
 * `players` holds PlayerState, not Player: controllers are runtime objects and
 * must never end up in persisted state.
 */
export interface GameState {
  readonly id: string;
  readonly board: string;
  round: number;
  phase: Phase;
  players: PlayerState[];
  pendingActions: Action[];
  events: GameEvent[];
  winner?: Faction;
}

export interface CreateGameStateParams {
  readonly id: string;
  readonly board: string;
  readonly players: readonly PlayerState[];
}

export function createGameState(params: CreateGameStateParams): GameState {
  return {
    id: params.id,
    board: params.board,
    round: 0,
    phase: 'GAME_START',
    players: params.players.map((player) => ({ ...player })),
    pendingActions: [],
    events: [],
  };
}

export function findPlayer(
  state: GameState,
  playerId: string,
): PlayerState | undefined {
  return state.players.find((player) => player.id === playerId);
}

/** Resolve a player, throwing if the id is not part of this game. */
export function requirePlayer(state: GameState, playerId: string): PlayerState {
  const player = findPlayer(state, playerId);
  if (player === undefined) {
    throw new Error(`Game "${state.id}" has no player "${playerId}"`);
  }
  return player;
}

export function alivePlayers(state: GameState): readonly PlayerState[] {
  return state.players.filter((player) => player.alive);
}

/** The only sanctioned way to change a player's life state. */
export function setPlayerAlive(
  state: GameState,
  playerId: string,
  alive: boolean,
): void {
  const player = requirePlayer(state, playerId);
  (player as { alive: boolean }).alive = alive;
}

/**
 * Event ids are derived from the game id and the current event count, so they
 * are unique per game, stable across replays, and need no global counter.
 */
export function nextEventId(state: GameState): string {
  return `${state.id}:e${state.events.length + 1}`;
}

export interface EventInit {
  readonly type: EventType;
  readonly visibility: Visibility;
  readonly payload: Readonly<Record<string, unknown>>;
  /** Audience for a `private` event. */
  readonly to?: readonly string[];
}

/** Record an event at the current phase and return it. */
export function appendEvent(state: GameState, init: EventInit): GameEvent {
  const id = nextEventId(state);
  const event: GameEvent =
    init.to === undefined
      ? {
          id,
          type: init.type,
          phase: state.phase,
          visibility: init.visibility,
          payload: init.payload,
        }
      : {
          id,
          type: init.type,
          phase: state.phase,
          visibility: init.visibility,
          payload: init.payload,
          to: init.to,
        };

  state.events.push(event);
  return event;
}
