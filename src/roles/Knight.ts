import type { Role } from '../domain/role.js';

/** 骑士 — duels one player during the day. */
export const Knight: Role = {
  id: 'knight',
  name: '骑士',
  faction: 'good',
  abilities: ['duel'],
};
