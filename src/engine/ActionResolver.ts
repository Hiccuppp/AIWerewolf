import { isStructuralActionType, type Action } from '../domain/action.js';
import { isAbilityId } from '../domain/role.js';
import { getRole } from '../roles/index.js';
import { findPlayer, type GameState } from './GameState.js';

/**
 * ActionResolver — the action system (architecture §9).
 *
 * Every behaviour is an `Action` and every `Action` enters the game through
 * here, including actions produced by the future LLMController. Because a
 * controller is untrusted input, `type` is a plain string (§9) and this module
 * decides what the engine will accept.
 *
 * PHASE 0 SCOPE — admission only:
 *   validated here: the actor exists and is alive; the action type is known;
 *                   the actor's role actually holds that ability; a named
 *                   target exists and is alive; a vote names a target.
 *   NOT here yet  : which phase permits which action, per-ability target
 *                   requirements, and turning admitted actions into effects
 *                   (deaths, protections, check results, exile).
 *
 * The effect rules are Phase 1 (architecture §13 "夜晚流程 / 白天流程 / 投票 /
 * 死亡 / 技能"). They are not stubbed out here on purpose: a guess at the order
 * in which guard, wolves and witch interact would be an abstraction invented
 * before its requirements exist.
 */

export type ActionRejectionReason =
  | 'malformed'
  | 'unknown_action_type'
  | 'unknown_actor'
  | 'actor_dead'
  | 'ability_not_held'
  | 'unknown_target'
  | 'target_dead';

export interface ActionRejection {
  readonly ok: false;
  readonly reason: ActionRejectionReason;
  readonly message: string;
}

export type ActionAccepted = { readonly ok: true };
export type ActionAdmission =
  | { readonly ok: true; readonly action: Action }
  | ActionRejection;

function reject(
  reason: ActionRejectionReason,
  message: string,
): ActionRejection {
  return { ok: false, reason, message };
}

/**
 * Decide whether an action is admissible for the current state.
 *
 * Returns `{ ok: true }` when acceptable, otherwise a rejection explaining why.
 */
export function validateAction(
  state: GameState,
  action: Action,
): ActionAccepted | ActionRejection {
  if (
    typeof action.type !== 'string' ||
    action.type.trim() === '' ||
    typeof action.actor !== 'string' ||
    action.actor.trim() === ''
  ) {
    return reject(
      'malformed',
      'An action needs a non-empty string "type" and "actor"',
    );
  }

  if (
    action.target !== undefined &&
    (typeof action.target !== 'string' || action.target.trim() === '')
  ) {
    return reject('malformed', 'An action "target" must be a non-empty string');
  }

  const isKnownType =
    isAbilityId(action.type) || isStructuralActionType(action.type);
  if (!isKnownType) {
    return reject(
      'unknown_action_type',
      `Unknown action type "${action.type}"`,
    );
  }

  const actor = findPlayer(state, action.actor);
  if (actor === undefined) {
    return reject('unknown_actor', `Unknown actor "${action.actor}"`);
  }
  if (!actor.alive) {
    return reject(
      'actor_dead',
      `Player "${actor.id}" is dead and cannot act`,
    );
  }

  if (isAbilityId(action.type)) {
    const role = getRole(actor.roleId);
    if (!role.abilities.includes(action.type)) {
      return reject(
        'ability_not_held',
        `Role "${role.id}" does not have the "${action.type}" ability`,
      );
    }
  }

  // A vote is meaningless without a target; `pass` is the way to abstain.
  if (action.type === 'vote' && action.target === undefined) {
    return reject('malformed', 'A vote must name a target');
  }

  if (action.target !== undefined) {
    const target = findPlayer(state, action.target);
    if (target === undefined) {
      return reject('unknown_target', `Unknown target "${action.target}"`);
    }
    if (!target.alive) {
      return reject(
        'target_dead',
        `Target "${target.id}" is already dead`,
      );
    }
  }

  return { ok: true };
}

/**
 * Validate an action and, if it passes, queue it on the state for the current
 * phase. Rejected actions never reach `pendingActions`.
 */
export function admitAction(state: GameState, action: Action): ActionAdmission {
  const validation = validateAction(state, action);
  if (!validation.ok) {
    return validation;
  }

  state.pendingActions.push(action);
  return { ok: true, action };
}

/** Take the queued actions for this phase and clear the queue. */
export function drainActions(state: GameState): readonly Action[] {
  const actions = state.pendingActions.slice();
  state.pendingActions.length = 0;
  return actions;
}
