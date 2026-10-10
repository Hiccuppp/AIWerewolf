import type { Role } from '../domain/role.js';

/** 狼人 — an ordinary wolf. */
export const Wolf: Role = {
  id: 'wolf',
  name: '狼人',
  faction: 'wolf',
  abilities: ['kill'],
};
