import { PHASES, type Phase } from '../domain/phase.js';
import { appendEvent, type GameState } from './GameState.js';

/**
 * PhaseMachine — the game flow (architecture §8).
 *
 * One round walks the §8 sequence:
 *
 *   GAME_START -> NIGHT_START -> WOLF_ACTION -> WITCH_ACTION -> SEER_ACTION
 *   -> NIGHT_RESOLVE -> DAY_START -> DEATH_ANNOUNCE -> SPEECH -> DISCUSSION
 *   -> VOTE -> EXECUTION -> DEATH_TRIGGER -> WIN_CHECK
 *
 * §8 draws the list as ending in GAME_END. A game that is not yet decided has
 * to play another night, and WIN_CHECK is where that decision belongs, so the
 * one transition §8 leaves implicit is added here:
 *
 *   WIN_CHECK -> NIGHT_START   when no faction has won yet (round += 1)
 *   WIN_CHECK -> GAME_END      when `winner` is set
 *
 * This is required by the architecture rather than invented: GameState.round
 * (§6) is a round *count*, and §13 requires an automatically played game, so
 * NIGHT_START must be re-enterable. Which actions are legal in which phase is
 * still a Phase 1 flow rule — see ActionResolver.
 */

export function phaseIndex(phase: Phase): number {
  return PHASES.indexOf(phase);
}

/** The next phase, given the current state. `GAME_END` is terminal. */
export function nextPhase(state: GameState): Phase {
  const current = state.phase;

  if (current === 'GAME_END') {
    return 'GAME_END';
  }

  if (current === 'WIN_CHECK') {
    return state.winner === undefined ? 'NIGHT_START' : 'GAME_END';
  }

  return PHASES[phaseIndex(current) + 1] as Phase;
}

/**
 * Advance the game by exactly one phase, recording the transition.
 *
 * A round is one night/day cycle, so `round` increments on entering
 * NIGHT_START: the first night is round 1.
 */
export function advance(state: GameState): Phase {
  const from = state.phase;
  const to = nextPhase(state);

  if (to === from) {
    return from;
  }

  state.phase = to;
  if (to === 'NIGHT_START') {
    state.round += 1;
  }

  appendEvent(state, {
    type: 'phase_changed',
    visibility: 'public',
    payload: { from, to, round: state.round },
  });

  return to;
}
