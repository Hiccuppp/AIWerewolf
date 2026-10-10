import type { Role } from '../domain/role.js';

/** 猎人 — shoots one player when it dies. */
export const Hunter: Role = {
  id: 'hunter',
  name: '猎人',
  faction: 'good',
  abilities: ['shoot'],
};
