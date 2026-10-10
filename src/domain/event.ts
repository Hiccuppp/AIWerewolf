import type { Phase } from './phase.js';

/**
 * Visibility — who is allowed to see an event (architecture §10).
 *
 * - `public`  : everyone, including the future Observer.
 * - `private` : only the players listed in `to`.
 * - `god`     : engine/bookkeeping only; never leaves the engine.
 */
export const VISIBILITIES = ['public', 'private', 'god'] as const;

export type Visibility = (typeof VISIBILITIES)[number];

/**
 * EventType — the events this build can emit.
 *
 * `check_result` is listed because architecture §7 defines the Seer's view
 * field (`checkResults`) in terms of it. Phase 0 does not produce it (no role
 * skill resolution yet); Phase 1 emits it when the Seer acts.
 */
export const EVENT_TYPES = [
  'game_created',
  'phase_changed',
  'player_died',
  'check_result',
  'game_ended',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

/**
 * GameEvent — the single record of what happened (architecture §10).
 *
 * Replaces v1's `logs: string[]`: events are structured, carry their phase and
 * visibility, and are what replay and the Observer layer read. `payload` shapes
 * used by this build:
 *
 *   game_created  { board: string, seats: number }
 *   phase_changed { from: Phase, to: Phase, round: number }
 *   player_died   { playerId: string, cause: string }
 *   check_result  { target: string, faction: Faction }   (private, Phase 1)
 *   game_ended    { winner: Faction }
 *
 * `to` is the audience of a `private` event. Architecture §10 shows the four
 * base fields; without an audience a PRIVATE event cannot be delivered to
 * anyone, so this one field is added — it is required by §7's information
 * isolation, not a future nicety.
 */
export interface GameEvent {
  readonly id: string;
  readonly type: EventType;
  readonly phase: Phase;
  readonly visibility: Visibility;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly to?: readonly string[];
}
