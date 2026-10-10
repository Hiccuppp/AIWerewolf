import type { Role } from '../domain/role.js';

/** 平民 — no abilities; the role every board pads with. */
export const Villager: Role = {
  id: 'villager',
  name: '平民',
  faction: 'good',
  abilities: [],
};
