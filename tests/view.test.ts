import { describe, expect, it } from 'vitest';

import { resolveDeaths } from '../src/engine/DeathResolver.js';
import { GameEngine } from '../src/engine/GameEngine.js';
import { appendEvent } from '../src/engine/GameState.js';
import { PRE_WOLF_HUNTER_IDIOT } from './fixtures/boards.js';

/**
 * Information isolation is "整个项目最重要部分" (architecture §7), so it gets
 * its own suite: a view must contain everything the seat legitimately knows and
 * nothing else.
 */

function createEngine(): GameEngine {
  return GameEngine.create({ id: 'game1', board: PRE_WOLF_HUNTER_IDIOT });
}

describe('PlayerView — public knowledge (architecture §7)', () => {
  it('describes other seats by id, seat and life state only', () => {
    const engine = createEngine();
    const view = engine.createView('player9');

    expect(view.players).toHaveLength(12);
    expect(Object.keys(view.players[0] ?? {})).toEqual(['id', 'seat', 'alive']);
    expect(view.players.map((player) => player.id)).toEqual(
      engine.state.players.map((player) => player.id),
    );
  });

  it('never carries another player\'s role', () => {
    const engine = createEngine();
    const view = engine.createView('player9');

    expect(JSON.stringify(view.players)).not.toMatch(
      /wolf|seer|witch|hunter|idiot|roleId/,
    );
  });

  it('gives every seat the same public event log', () => {
    const engine = createEngine();
    engine.advance();

    const publicEvents = engine.createView('player1').publicEvents;
    expect(publicEvents.map((event) => event.type)).toEqual([
      'game_created',
      'phase_changed',
    ]);
    expect(engine.createView('player9').publicEvents).toEqual(publicEvents);
  });
});

describe('PlayerView — role knowledge (architecture §7)', () => {
  it('tells a wolf who the other wolves are', () => {
    const engine = createEngine();
    const view = engine.createView('player1');

    expect(view.roleId).toBe('wolf');
    expect(view.faction).toBe('wolf');
    expect(view.teammates).toEqual(['player2', 'player3', 'player4']);
  });

  it('shows no teammates to any non-wolf', () => {
    const engine = createEngine();

    for (const playerId of ['player5', 'player6', 'player7', 'player9']) {
      expect(engine.createView(playerId).teammates).toEqual([]);
    }
  });

  it('keeps the wolf team visible to a dead wolf', () => {
    const engine = createEngine();
    resolveDeaths(engine.state, [{ playerId: 'player1', cause: 'exiled' }]);

    const view = engine.createView('player1');
    expect(view.alive).toBe(false);
    expect(view.teammates).toEqual(['player2', 'player3', 'player4']);
  });

  it('starts every seat with no check results', () => {
    const engine = createEngine();
    expect(engine.createView('player5').checkResults).toEqual({});
  });
});

describe('PlayerView — private events (architecture §10)', () => {
  it('delivers a private event to its audience and to nobody else', () => {
    const engine = createEngine();
    appendEvent(engine.state, {
      type: 'check_result',
      visibility: 'private',
      payload: { target: 'player1', faction: 'wolf' },
      to: ['player5'],
    });

    const seer = engine.createView('player5');
    expect(seer.privateEvents).toHaveLength(1);
    expect(seer.checkResults).toEqual({ player1: 'wolf' });

    const villager = engine.createView('player9');
    expect(villager.privateEvents).toEqual([]);
    expect(villager.checkResults).toEqual({});
    expect(villager.publicEvents).toEqual(seer.publicEvents);
  });

  it('folds only the check results addressed to this seat', () => {
    const engine = createEngine();
    appendEvent(engine.state, {
      type: 'check_result',
      visibility: 'private',
      payload: { target: 'player1', faction: 'wolf' },
      to: ['player5'],
    });
    appendEvent(engine.state, {
      type: 'check_result',
      visibility: 'private',
      payload: { target: 'player2', faction: 'wolf' },
      to: ['player6'],
    });

    expect(engine.createView('player5').checkResults).toEqual({
      player1: 'wolf',
    });
    // player6 has its own result and must not see the seer's.
    expect(engine.createView('player6').checkResults).toEqual({
      player2: 'wolf',
    });
    expect(engine.createView('player9').checkResults).toEqual({});
  });

  it('ignores a malformed check_result payload rather than trusting it', () => {
    const engine = createEngine();
    appendEvent(engine.state, {
      type: 'check_result',
      visibility: 'private',
      payload: { target: 42, faction: 'dragon' },
      to: ['player5'],
    });

    const seer = engine.createView('player5');
    expect(seer.checkResults).toEqual({});
    expect(seer.privateEvents).toHaveLength(1);
  });

  it('never leaks a god-visibility event into any view', () => {
    const engine = createEngine();
    appendEvent(engine.state, {
      type: 'game_created',
      visibility: 'god',
      payload: { secret: 'player1 is the wolf king' },
    });

    for (const playerId of ['player1', 'player5', 'player9']) {
      const view = engine.createView(playerId);
      expect(view.publicEvents).toHaveLength(1);
      expect(view.privateEvents).toEqual([]);
      expect(JSON.stringify(view)).not.toContain('wolf king');
    }
  });
});

describe('PlayerView — detachment', () => {
  it('is a snapshot that cannot mutate game state', () => {
    const engine = createEngine();
    const before = engine.createView('player9');

    expect(before.players).not.toBe(engine.state.players);

    resolveDeaths(engine.state, [{ playerId: 'player9', cause: 'exiled' }]);

    expect(before.players.find((player) => player.id === 'player9')?.alive).toBe(
      true,
    );
    expect(
      engine.createView('player9').players.find((player) => player.id === 'player9')
        ?.alive,
    ).toBe(false);
  });

  it('reports the current round and phase', () => {
    const engine = createEngine();
    engine.advance();

    const view = engine.createView('player1');
    expect(view.round).toBe(1);
    expect(view.phase).toBe('NIGHT_START');
  });

  it('refuses to build a view for a seat that does not exist', () => {
    const engine = createEngine();
    expect(() => engine.createView('player99')).toThrow(/has no player "player99"/);
  });
});
