import { describe, expect, it } from 'vitest';

import {
  boardRoleIds,
  validateBoard,
  type BoardDefinition,
} from '../src/boards/BoardDefinition.js';
import {
  isStructuralActionType,
  STRUCTURAL_ACTION_TYPES,
} from '../src/domain/action.js';
import { PHASES } from '../src/domain/phase.js';
import { ABILITY_IDS, isAbilityId } from '../src/domain/role.js';
import { findRole, getRole, hasRole, ROLE_CATALOG } from '../src/roles/index.js';
import { PRE_WOLF_HUNTER_IDIOT } from './fixtures/boards.js';

describe('phase model (architecture §8)', () => {
  it('declares exactly the phases of §8, in order', () => {
    expect([...PHASES]).toEqual([
      'GAME_START',
      'NIGHT_START',
      'WOLF_ACTION',
      'WITCH_ACTION',
      'SEER_ACTION',
      'NIGHT_RESOLVE',
      'DAY_START',
      'DEATH_ANNOUNCE',
      'SPEECH',
      'DISCUSSION',
      'VOTE',
      'EXECUTION',
      'DEATH_TRIGGER',
      'WIN_CHECK',
      'GAME_END',
    ]);
  });
});

describe('role catalog (architecture §4)', () => {
  it('defines every role the architecture names, plus the villager a board needs', () => {
    expect([...ROLE_CATALOG].map((role) => role.id).sort()).toEqual([
      'guard',
      'hunter',
      'idiot',
      'knight',
      'seer',
      'villager',
      'witch',
      'wolf',
      'wolf_beauty',
      'wolf_king',
    ]);
  });

  it('keeps role ids unique', () => {
    const ids = ROLE_CATALOG.map((role) => role.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('describes roles as data, exactly as §4 specifies', () => {
    expect(getRole('wolf_king')).toEqual({
      id: 'wolf_king',
      name: '狼王',
      faction: 'wolf',
      abilities: ['kill', 'revenge_shot'],
    });
  });

  it('only uses known abilities and known factions', () => {
    for (const role of ROLE_CATALOG) {
      expect(['wolf', 'good']).toContain(role.faction);
      for (const ability of role.abilities) {
        expect(ABILITY_IDS).toContain(ability);
      }
    }
  });

  it('puts every wolf-faction role on the wolf side and the rest on the good side', () => {
    const wolves = ROLE_CATALOG.filter((role) => role.faction === 'wolf');
    expect(wolves.map((role) => role.id).sort()).toEqual([
      'wolf',
      'wolf_beauty',
      'wolf_king',
    ]);
  });

  it('looks role ids up case- and whitespace-insensitively, as §12 writes them', () => {
    expect(getRole('WOLF').id).toBe('wolf');
    expect(getRole('  Villager ').id).toBe('villager');
    expect(hasRole('SEER')).toBe(true);
    expect(findRole('nobody')).toBeUndefined();
  });

  it('fails loudly on an unknown role id', () => {
    expect(() => getRole('dragon')).toThrow(/Unknown role "dragon"/);
  });
});

describe('ability and action type guards', () => {
  it('recognises abilities and structural action types', () => {
    expect(isAbilityId('kill')).toBe(true);
    expect(isAbilityId('vote')).toBe(false);
    expect(isStructuralActionType('vote')).toBe(true);
    expect(isStructuralActionType('pass')).toBe(true);
    expect(isStructuralActionType('kill')).toBe(false);
    expect(STRUCTURAL_ACTION_TYPES).toEqual(['vote', 'pass']);
  });
});

describe('board definition (architecture §12)', () => {
  it('accepts a well-formed board', () => {
    expect(() => validateBoard(PRE_WOLF_HUNTER_IDIOT)).not.toThrow();
  });

  it('normalises role ids to their canonical form', () => {
    const roleIds = boardRoleIds(PRE_WOLF_HUNTER_IDIOT);
    expect(roleIds.slice(0, 6)).toEqual([
      'wolf',
      'wolf',
      'wolf',
      'wolf',
      'seer',
      'witch',
    ]);
    expect(roleIds).toHaveLength(12);
  });

  it('rejects a board whose role count does not match its player count', () => {
    const board: BoardDefinition = {
      id: 'broken',
      players: 12,
      roles: ['WOLF', 'VILLAGER'],
    };
    expect(() => validateBoard(board)).toThrow(/declares 12 players but lists 2/);
  });

  it('rejects a board naming a role outside the catalog', () => {
    const board: BoardDefinition = {
      id: 'broken',
      players: 2,
      roles: ['WOLF', 'DRAGON'],
    };
    expect(() => validateBoard(board)).toThrow(/unknown role\(s\): dragon/i);
  });

  it('rejects a board with no id or an impossible player count', () => {
    expect(() =>
      validateBoard({ id: '  ', players: 1, roles: ['WOLF'] }),
    ).toThrow(/id must not be empty/);

    expect(() =>
      validateBoard({ id: 'odd', players: 2.5, roles: ['WOLF', 'WOLF'] }),
    ).toThrow(/positive integer player count/);
  });
});
