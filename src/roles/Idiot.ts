import type { Role } from '../domain/role.js';

/** 白痴 — survives exile, then loses the right to vote. */
export const Idiot: Role = {
  id: 'idiot',
  name: '白痴',
  faction: 'good',
  abilities: ['immune_execution'],
};
