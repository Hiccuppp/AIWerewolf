import type { BoardDefinition } from '../../src/boards/BoardDefinition.js';

/**
 * 预女猎白 (architecture §5), used as a fixture while the board presets are
 * still Phase 1 work.
 *
 * Role ids are written in the upper case style of §12 on purpose: this doubles
 * as a test that board role ids are normalised.
 *
 * Seats: 1-4 wolves, 5 seer, 6 witch, 7 hunter, 8 idiot, 9-12 villagers.
 */
export const PRE_WOLF_HUNTER_IDIOT: BoardDefinition = {
  id: 'pre_wolf_hunter_idiot',
  players: 12,
  roles: [
    'WOLF',
    'WOLF',
    'WOLF',
    'WOLF',
    'SEER',
    'WITCH',
    'HUNTER',
    'IDIOT',
    'VILLAGER',
    'VILLAGER',
    'VILLAGER',
    'VILLAGER',
  ],
};
