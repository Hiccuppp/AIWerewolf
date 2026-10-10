import type { Faction } from './faction.js';

/**
 * AbilityId — the concrete ability a role owns.
 *
 * Per architecture §4, a role is *data*, not a class: `{ id, name, faction,
 * abilities }`. Abilities are strings so new roles can be added as
 * configuration (boards) rather than code.
 *
 * Only abilities actually used by the roles in src/roles/ are listed. Passive
 * abilities (e.g. `immune_execution`) are in the same flat list because §4
 * models abilities as one array; Phase 1 decides which are active in which
 * phase.
 */
export const ABILITY_IDS = [
  /** Wolves: agree on a night kill. */
  'kill',
  /** Wolf King: may shoot one player when it dies. */
  'revenge_shot',
  /** Wolf Beauty: charms a player. */
  'charm',
  /** Seer: checks one player's faction. */
  'check',
  /** Witch: saves the night's victim. */
  'save',
  /** Witch: poisons one player. */
  'poison',
  /** Hunter: shoots one player when it dies. */
  'shoot',
  /** Idiot: survives being exiled, but loses the vote. */
  'immune_execution',
  /** Guard: protects one player from the night kill. */
  'protect',
  /** Knight: duels one player during the day. */
  'duel',
] as const;

export type AbilityId = (typeof ABILITY_IDS)[number];

const ABILITY_ID_SET: ReadonlySet<string> = new Set<string>(ABILITY_IDS);

export function isAbilityId(value: string): value is AbilityId {
  return ABILITY_ID_SET.has(value);
}

/**
 * Role — static definition of a role.
 *
 * This is the only place a role's faction lives. Player state stores a
 * `roleId`; the engine resolves it through the role catalog (src/roles/).
 */
export interface Role {
  readonly id: string;
  readonly name: string;
  readonly faction: Faction;
  readonly abilities: readonly AbilityId[];
}
