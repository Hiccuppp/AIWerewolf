import { describe, expect, it } from 'vitest';

import { PHASES, type Phase } from '../src/domain/phase.js';
import { resolveDeaths } from '../src/engine/DeathResolver.js';
import { GameEngine } from '../src/engine/GameEngine.js';
import { checkVictory, countFactions } from '../src/engine/VictoryChecker.js';
import { PRE_WOLF_HUNTER_IDIOT } from './fixtures/boards.js';
import { ScriptedController } from './fixtures/controllers.js';

/** Seat layout of the fixture board: 1-4 wolves, 5 seer, 6 witch, 7 hunter, 8 idiot, 9-12 villagers. */
const WOLF_SEATS = ['player1', 'player2', 'player3', 'player4'];
const GOOD_SEATS = [
  'player5',
  'player6',
  'player7',
  'player8',
  'player9',
  'player10',
  'player11',
  'player12',
];

function createEngine(id = 'game1'): GameEngine {
  return GameEngine.create({ id, board: PRE_WOLF_HUNTER_IDIOT });
}

/** Walk the phase machine until WIN_CHECK, one phase at a time. */
function walkToWinCheck(engine: GameEngine): Phase[] {
  const visited: Phase[] = [engine.phase];
  while (engine.phase !== 'WIN_CHECK') {
    visited.push(engine.advance());
  }
  return visited;
}

describe('GameEngine.create (architecture §6, §12)', () => {
  it('builds a GameState from a board', () => {
    const engine = createEngine();

    expect(engine.id).toBe('game1');
    expect(engine.state.board).toBe('pre_wolf_hunter_idiot');
    expect(engine.state.phase).toBe('GAME_START');
    expect(engine.state.round).toBe(0);
    expect(engine.state.winner).toBeUndefined();
    expect(engine.state.pendingActions).toEqual([]);
  });

  it('creates one player per seat, with ids and seats starting at 1', () => {
    const engine = createEngine();
    const players = engine.state.players;

    expect(players).toHaveLength(12);
    expect(players.map((player) => player.id)).toEqual(
      Array.from({ length: 12 }, (_, index) => `player${index + 1}`),
    );
    expect(players.map((player) => player.seat)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    );
    expect(players.every((player) => player.alive)).toBe(true);
  });

  it('deals the board roles to seats in order, normalised to canonical ids', () => {
    const engine = createEngine();
    const roleIds = engine.state.players.map((player) => player.roleId);

    expect(roleIds).toEqual([
      'wolf',
      'wolf',
      'wolf',
      'wolf',
      'seer',
      'witch',
      'hunter',
      'idiot',
      'villager',
      'villager',
      'villager',
      'villager',
    ]);
  });

  it('records creation as the first public event', () => {
    const engine = createEngine();
    const events = engine.state.events;

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: 'game1:e1',
      type: 'game_created',
      phase: 'GAME_START',
      visibility: 'public',
      payload: { board: 'pre_wolf_hunter_idiot', seats: 12 },
    });
  });

  it('refuses to build a game from an invalid board', () => {
    expect(() =>
      GameEngine.create({
        id: 'bad',
        board: { id: 'bad', players: 3, roles: ['WOLF'] },
      }),
    ).toThrow(/declares 3 players but lists 1 role/);
  });
});

describe('phase machine (architecture §8)', () => {
  it('walks a full round in the documented order', () => {
    const engine = createEngine();
    const visited = walkToWinCheck(engine);

    expect(visited).toEqual(PHASES.slice(0, 14));
    expect(engine.phase).toBe('WIN_CHECK');
  });

  it('counts rounds from the first night, not from GAME_START', () => {
    const engine = createEngine();

    expect(engine.round).toBe(0);
    engine.advance();
    expect(engine.phase).toBe('NIGHT_START');
    expect(engine.round).toBe(1);

    walkToWinCheck(engine);
    expect(engine.round).toBe(1);
  });

  it('plays another night when nobody has won, and ends when someone has', () => {
    const engine = createEngine();
    walkToWinCheck(engine);

    expect(engine.winner).toBeUndefined();
    expect(engine.advance()).toBe('NIGHT_START');
    expect(engine.round).toBe(2);
  });

  it('records every transition as a public event carrying the round', () => {
    const engine = createEngine();
    engine.advance();

    expect(engine.state.events[1]).toMatchObject({
      id: 'game1:e2',
      type: 'phase_changed',
      phase: 'NIGHT_START',
      visibility: 'public',
      payload: { from: 'GAME_START', to: 'NIGHT_START', round: 1 },
    });
  });

  it('treats GAME_END as terminal', () => {
    const engine = createEngine();
    resolveDeaths(
      engine.state,
      WOLF_SEATS.map((playerId) => ({ playerId, cause: 'exiled' })),
    );
    walkToWinCheck(engine);

    expect(engine.winner).toBe('good');
    expect(engine.advance()).toBe('GAME_END');
    expect(engine.advance()).toBe('GAME_END');
    expect(engine.isOver()).toBe(true);
  });
});

describe('VictoryChecker (architecture §6, §8 WIN_CHECK)', () => {
  it('counts only living players, by faction', () => {
    const engine = createEngine();
    expect(countFactions(engine.state)).toEqual({ wolf: 4, good: 8 });

    resolveDeaths(engine.state, [{ playerId: 'player1', cause: 'exiled' }]);
    expect(countFactions(engine.state)).toEqual({ wolf: 3, good: 8 });
  });

  it('leaves the game open while the good camp still outnumbers the wolves', () => {
    const engine = createEngine();
    expect(checkVictory(engine.state)).toBeUndefined();
  });

  it('gives the good camp the win when the last wolf dies', () => {
    const engine = createEngine();
    resolveDeaths(
      engine.state,
      WOLF_SEATS.map((playerId) => ({ playerId, cause: 'exiled' })),
    );

    expect(checkVictory(engine.state)).toBe('good');
  });

  it('gives the wolves the win at parity', () => {
    const engine = createEngine();
    // 4 wolves against 8 good: five good deaths reach parity.
    resolveDeaths(
      engine.state,
      ['player8', 'player9', 'player10', 'player11', 'player12'].map(
        (playerId) => ({ playerId, cause: 'night_kill' }),
      ),
    );

    expect(countFactions(engine.state)).toEqual({ wolf: 4, good: 3 });
    expect(checkVictory(engine.state)).toBe('wolf');
  });

  it('settles the winner when WIN_CHECK is reached', () => {
    const engine = createEngine();
    resolveDeaths(
      engine.state,
      GOOD_SEATS.slice(3).map((playerId) => ({
        playerId,
        cause: 'night_kill',
      })),
    );

    walkToWinCheck(engine);

    expect(engine.winner).toBe('wolf');
    expect(engine.isOver()).toBe(true);
    expect(engine.state.events.at(-1)).toMatchObject({
      type: 'game_ended',
      visibility: 'public',
      payload: { winner: 'wolf' },
    });
  });
});

describe('DeathResolver (architecture §8 DEATH_ANNOUNCE)', () => {
  it('kills the player and announces it publicly', () => {
    const engine = createEngine();
    const events = resolveDeaths(engine.state, [
      { playerId: 'player5', cause: 'night_kill' },
    ]);

    expect(engine.state.players[4]?.alive).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'player_died',
      visibility: 'public',
      payload: { playerId: 'player5', cause: 'night_kill' },
    });
  });

  it('ignores a repeat death and reports nothing twice', () => {
    const engine = createEngine();
    resolveDeaths(engine.state, [{ playerId: 'player5', cause: 'night_kill' }]);
    const second = resolveDeaths(engine.state, [
      { playerId: 'player5', cause: 'poisoned' },
    ]);

    expect(second).toHaveLength(0);
    expect(
      engine.state.events.filter((event) => event.type === 'player_died'),
    ).toHaveLength(1);
  });

  it('rejects an unknown player id instead of silently ignoring it', () => {
    const engine = createEngine();
    expect(() =>
      resolveDeaths(engine.state, [{ playerId: 'player99', cause: 'x' }]),
    ).toThrow(/Cannot kill unknown player "player99"/);
  });
});

describe('controller binding (architecture §5, §11)', () => {
  it('has no runtime Player for a seat until a controller is bound', () => {
    const engine = createEngine();

    expect(engine.getPlayer('player1')).toBeUndefined();

    engine.bindController(
      'player1',
      new ScriptedController({ type: 'kill', actor: 'player1', target: 'player5' }),
    );

    expect(engine.getPlayer('player1')).toMatchObject({
      id: 'player1',
      seat: 1,
      alive: true,
    });
    expect(engine.getPlayer('player1')?.role.id).toBe('wolf');
  });

  it('rejects binding a controller to an unknown seat', () => {
    const engine = createEngine();
    expect(() =>
      engine.bindController('player99', new ScriptedController({ type: 'pass', actor: 'player99' })),
    ).toThrow(/has no player "player99"/);
  });

  it('hands a controller nothing but its own context', async () => {
    const engine = createEngine();
    const controller = new ScriptedController({
      type: 'kill',
      actor: 'player1',
      target: 'player5',
    });
    engine.bindController('player1', controller);

    const player = engine.getPlayer('player1');
    expect(player).toBeDefined();
    const action = await player?.controller.decide(engine.createContext('player1'));

    expect(action).toEqual({ type: 'kill', actor: 'player1', target: 'player5' });
    expect(controller.received).toHaveLength(1);
    expect(controller.received[0]?.view.playerId).toBe('player1');
    expect(Object.keys(controller.received[0] ?? {})).toEqual(['view']);
  });
});
