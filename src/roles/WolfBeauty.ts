import type { Role } from '../domain/role.js';

/** 狼美人 — a wolf that charms one player. */
export const WolfBeauty: Role = {
  id: 'wolf_beauty',
  name: '狼美人',
  faction: 'wolf',
  abilities: ['kill', 'charm'],
};
