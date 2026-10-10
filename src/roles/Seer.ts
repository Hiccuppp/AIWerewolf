import type { Role } from '../domain/role.js';

/** 预言家 — checks one player's faction each night. */
export const Seer: Role = {
  id: 'seer',
  name: '预言家',
  faction: 'good',
  abilities: ['check'],
};
