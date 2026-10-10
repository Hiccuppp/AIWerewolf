import { isAbilityId, type AbilityId } from './role.js';

/**
 * Action types that belong to the game flow rather than to a role's abilities.
 */
export const STRUCTURAL_ACTION_TYPES = ['vote', 'pass'] as const;

export type StructuralActionType = (typeof STRUCTURAL_ACTION_TYPES)[number];

const STRUCTURAL_ACTION_TYPE_SET: ReadonlySet<string> = new Set<string>(
  STRUCTURAL_ACTION_TYPES,
);

export function isStructuralActionType(
  value: string,
): value is StructuralActionType {
  return STRUCTURAL_ACTION_TYPE_SET.has(value);
}

/**
 * Action — every player behaviour goes through this one shape (architecture §9).
 *
 * `type` is intentionally `string`, not a union: controllers (including the
 * future LLMController) produce untrusted input, so the engine validates every
 * action in ActionResolver rather than trusting the type system.
 *
 * Examples (§9):
 *   { type: 'kill', actor: 'wolf1', target: 'player5' }
 *   { type: 'vote', actor: 'player2', target: 'player8' }
 */
export interface Action {
  readonly type: string;
  readonly actor: string;
  readonly target?: string;
  readonly data?: unknown;
}

export function isAbilityAction(
  action: Action,
): action is Action & { type: AbilityId } {
  return isAbilityId(action.type);
}
