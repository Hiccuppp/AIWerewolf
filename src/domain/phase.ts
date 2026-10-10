/**
 * Phase — the game flow states.
 *
 * Declaration order *is* the flow: see engine/PhaseMachine.ts.
 * Architecture: docs/AIWerewolf_v2_Architecture.md §8.
 */
export const PHASES = [
  'GAME_START',
  'NIGHT_START',
  'WOLF_ACTION',
  'WITCH_ACTION',
  'SEER_ACTION',
  'NIGHT_RESOLVE',
  'DAY_START',
  'DEATH_ANNOUNCE',
  'SPEECH',
  'DISCUSSION',
  'VOTE',
  'EXECUTION',
  'DEATH_TRIGGER',
  'WIN_CHECK',
  'GAME_END',
] as const;

export type Phase = (typeof PHASES)[number];
