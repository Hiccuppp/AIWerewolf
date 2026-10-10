import type { Role } from '../domain/role.js';

/** 女巫 — one save potion and one poison potion. */
export const Witch: Role = {
  id: 'witch',
  name: '女巫',
  faction: 'good',
  abilities: ['save', 'poison'],
};
