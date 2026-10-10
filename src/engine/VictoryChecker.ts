import type { Faction } from '../domain/faction.js';
import { getRole } from '../roles/index.js';
import type { GameState } from './GameState.js';

/**
 * VictoryChecker — the win condition (architecture §6 `winner`, §8 WIN_CHECK).
 *
 * Wolves win by reaching parity; the good camp wins by eliminating every wolf.
 * Only factions matter here, so this needs no role skill rules and is complete
 * in Phase 0.
 */
export interface FactionCounts {
  readonly wolf: number;
  readonly good: number;
}

/** Living players per faction — dead players never count. */
export function countFactions(state: GameState): FactionCounts {
  let wolf = 0;
  let good = 0;

  for (const player of state.players) {
    if (!player.alive) {
      continue;
    }
    if (getRole(player.roleId).faction === 'wolf') {
      wolf += 1;
    } else {
      good += 1;
    }
  }

  return { wolf, good };
}

/** The winning faction, or `undefined` while the game is still open. */
export function checkVictory(state: GameState): Faction | undefined {
  const { wolf, good } = countFactions(state);

  if (wolf === 0) {
    return 'good';
  }
  if (wolf >= good) {
    return 'wolf';
  }
  return undefined;
}
