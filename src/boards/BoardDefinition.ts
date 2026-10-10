import { hasRole, normalizeRoleId } from '../roles/index.js';

/**
 * BoardDefinition — a board is configuration, not code (architecture §12).
 *
 *     { id: 'pre_wolf_hunter_idiot', players: 12,
 *       roles: ['WOLF','WOLF','WOLF','WOLF','SEER','WITCH','HUNTER','IDIOT',
 *               'VILLAGER','VILLAGER','VILLAGER','VILLAGER'] }
 *
 * `id` is added to §12's example because GameState.board (§6) is a string and
 * replay/selection (§13) must be able to name the board again. Everything else
 * is exactly §12: a seat count and one role id per seat.
 *
 * The three concrete boards of §5 are Phase 1 work, not Phase 0: this module
 * only defines and validates the shape.
 */
export interface BoardDefinition {
  readonly id: string;
  readonly players: number;
  readonly roles: readonly string[];
}

/** Canonical (normalised) role id per seat, in seat order. */
export function boardRoleIds(board: BoardDefinition): readonly string[] {
  return board.roles.map(normalizeRoleId);
}

/**
 * Check a board definition, throwing a descriptive error if it is unusable.
 *
 * A board is the input that decides how many players exist and what they are,
 * so an invalid one must fail loudly at game creation rather than silently
 * producing a broken GameState.
 */
export function validateBoard(board: BoardDefinition): void {
  if (board.id.trim() === '') {
    throw new Error('Board id must not be empty');
  }

  if (!Number.isInteger(board.players) || board.players < 1) {
    throw new Error(
      `Board "${board.id}" must declare a positive integer player count, got ${board.players}`,
    );
  }

  if (board.roles.length !== board.players) {
    throw new Error(
      `Board "${board.id}" declares ${board.players} players but lists ${board.roles.length} roles`,
    );
  }

  const unknown = [
    ...new Set(board.roles.filter((roleId) => !hasRole(roleId))),
  ];
  if (unknown.length > 0) {
    throw new Error(
      `Board "${board.id}" refers to unknown role(s): ${unknown.join(', ')}`,
    );
  }
}
