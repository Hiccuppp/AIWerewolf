import type { GameEvent } from '../domain/event.js';
import {
  appendEvent,
  findPlayer,
  setPlayerAlive,
  type GameState,
} from './GameState.js';

/**
 * DeathResolver — applies death, and records it (architecture §6 `alive`,
 * §10 events, §13 "死亡").
 *
 * This is the *mechanism*: a list of decided deaths becomes state plus public
 * `player_died` events. Working out who dies (night kills, protections, poison,
 * exile, and the death-trigger skills of §8 DEATH_TRIGGER) is a flow rule and
 * belongs to Phase 1.
 */
export interface Death {
  readonly playerId: string;
  /** Why the player died, e.g. `night_kill`. */
  readonly cause: string;
}

/**
 * Mark each player dead and emit one public event per new death.
 *
 * Already-dead players are ignored so the same cause can be reported twice
 * without corrupting state. An unknown player id is a programmer error.
 */
export function resolveDeaths(
  state: GameState,
  deaths: readonly Death[],
): readonly GameEvent[] {
  const events: GameEvent[] = [];

  for (const death of deaths) {
    const player = findPlayer(state, death.playerId);
    if (player === undefined) {
      throw new Error(
        `Cannot kill unknown player "${death.playerId}" in game "${state.id}"`,
      );
    }
    if (!player.alive) {
      continue;
    }

    setPlayerAlive(state, death.playerId, false);
    events.push(
      appendEvent(state, {
        type: 'player_died',
        visibility: 'public',
        payload: { playerId: death.playerId, cause: death.cause },
      }),
    );
  }

  return events;
}
