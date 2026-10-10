import type { Role } from '../domain/role.js';

/** 狼王 — a wolf that may take one player with it when it dies. */
export const WolfKing: Role = {
  id: 'wolf_king',
  name: '狼王',
  faction: 'wolf',
  abilities: ['kill', 'revenge_shot'],
};
