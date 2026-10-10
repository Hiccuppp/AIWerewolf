import type { Role } from '../domain/role.js';
import { Guard } from './Guard.js';
import { Hunter } from './Hunter.js';
import { Idiot } from './Idiot.js';
import { Knight } from './Knight.js';
import { Seer } from './Seer.js';
import { Villager } from './Villager.js';
import { Witch } from './Witch.js';
import { Wolf } from './Wolf.js';
import { WolfBeauty } from './WolfBeauty.js';
import { WolfKing } from './WolfKing.js';

/**
 * The role catalog: every role this build knows about.
 *
 * Roles are data (architecture §4), so a board (§12) can only refer to ids from
 * this list. Adding a role means adding a definition here and listing it in a
 * board — never touching the engine.
 */
export const ROLE_CATALOG: readonly Role[] = [
  Wolf,
  WolfKing,
  WolfBeauty,
  Villager,
  Seer,
  Witch,
  Hunter,
  Idiot,
  Guard,
  Knight,
];

/**
 * Role ids are canonical in lower snake case (`wolf_king`). Architecture §12
 * writes board config in upper case (`"WOLF"`, `"VILLAGER"`), so lookups
 * normalise case and surrounding whitespace instead of failing on the doc's own
 * example.
 */
export function normalizeRoleId(roleId: string): string {
  return roleId.trim().toLowerCase();
}

const ROLES_BY_ID: ReadonlyMap<string, Role> = new Map(
  ROLE_CATALOG.map((role) => [normalizeRoleId(role.id), role]),
);

export function findRole(roleId: string): Role | undefined {
  return ROLES_BY_ID.get(normalizeRoleId(roleId));
}

export function hasRole(roleId: string): boolean {
  return ROLES_BY_ID.has(normalizeRoleId(roleId));
}

/** Resolve a role id, throwing if the catalog does not know it. */
export function getRole(roleId: string): Role {
  const role = findRole(roleId);
  if (role === undefined) {
    const known = [...ROLES_BY_ID.keys()].sort().join(', ');
    throw new Error(`Unknown role "${roleId}". Known roles: ${known}`);
  }
  return role;
}

export { Guard, Hunter, Idiot, Knight, Seer, Villager, Witch, Wolf, WolfBeauty, WolfKing };
