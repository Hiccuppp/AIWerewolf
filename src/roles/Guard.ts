import type { Role } from '../domain/role.js';

/** 守卫 — protects one player from the night kill. */
export const Guard: Role = {
  id: 'guard',
  name: '守卫',
  faction: 'good',
  abilities: ['protect'],
};
