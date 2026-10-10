import { describe, expect, it } from 'vitest';

import type { Action } from '../src/domain/action.js';
import { resolveDeaths } from '../src/engine/DeathResolver.js';
import { GameEngine } from '../src/engine/GameEngine.js';
import { PRE_WOLF_HUNTER_IDIOT } from './fixtures/boards.js';

function createEngine(): GameEngine {
  return GameEngine.create({ id: 'game1', board: PRE_WOLF_HUNTER_IDIOT });
}

/** Rejection reason of an action, or `undefined` when it was accepted. */
function rejectionOf(engine: GameEngine, action: Action): string | undefined {
  const result = engine.submitAction(action);
  return result.ok ? undefined : result.reason;
}

describe('ActionResolver admission (architecture §9)', () => {
  it('accepts an action the actor\'s role can actually perform', () => {
    const engine = createEngine();
    const action: Action = { type: 'kill', actor: 'player1', target: 'player5' };

    expect(engine.submitAction(action)).toEqual({ ok: true, action });
    expect(engine.state.pendingActions).toEqual([action]);
  });

  it('accepts every role ability on the role that owns it', () => {
    const engine = createEngine();

    expect(
      rejectionOf(engine, { type: 'check', actor: 'player5', target: 'player1' }),
    ).toBeUndefined();
    expect(
      rejectionOf(engine, { type: 'poison', actor: 'player6', target: 'player1' }),
    ).toBeUndefined();
    expect(
      rejectionOf(engine, { type: 'save', actor: 'player6', target: 'player1' }),
    ).toBeUndefined();
    expect(
      rejectionOf(engine, { type: 'shoot', actor: 'player7', target: 'player1' }),
    ).toBeUndefined();
  });

  it('accepts a vote and a pass, which belong to no role', () => {
    const engine = createEngine();

    expect(
      rejectionOf(engine, { type: 'vote', actor: 'player9', target: 'player1' }),
    ).toBeUndefined();
    expect(rejectionOf(engine, { type: 'pass', actor: 'player9' })).toBeUndefined();
  });

  it('rejects an ability the actor\'s role does not have', () => {
    const engine = createEngine();

    expect(
      rejectionOf(engine, { type: 'kill', actor: 'player9', target: 'player1' }),
    ).toBe('ability_not_held');
    expect(
      rejectionOf(engine, { type: 'kill', actor: 'player5', target: 'player1' }),
    ).toBe('ability_not_held');
  });

  it('rejects an unknown or dead actor', () => {
    const engine = createEngine();
    expect(
      rejectionOf(engine, { type: 'kill', actor: 'player99', target: 'player5' }),
    ).toBe('unknown_actor');

    resolveDeaths(engine.state, [{ playerId: 'player1', cause: 'night_kill' }]);
    expect(
      rejectionOf(engine, { type: 'kill', actor: 'player1', target: 'player5' }),
    ).toBe('actor_dead');
  });

  it('rejects an unknown or dead target', () => {
    const engine = createEngine();
    expect(
      rejectionOf(engine, { type: 'kill', actor: 'player1', target: 'player99' }),
    ).toBe('unknown_target');

    resolveDeaths(engine.state, [{ playerId: 'player9', cause: 'poisoned' }]);
    expect(
      rejectionOf(engine, {
        type: 'vote',
        actor: 'player2',
        target: 'player9',
      }),
    ).toBe('target_dead');
  });

  it('rejects an action with no target, and a vote that names none', () => {
    const engine = createEngine();

    expect(rejectionOf(engine, { type: 'vote', actor: 'player2' })).toBe(
      'malformed',
    );
    expect(rejectionOf(engine, { type: '', actor: 'player2' })).toBe('malformed');
    expect(rejectionOf(engine, { type: 'kill', actor: '   ' })).toBe('malformed');
  });

  it('rejects an action type the engine does not know', () => {
    const engine = createEngine();

    expect(
      rejectionOf(engine, { type: 'dance', actor: 'player2', target: 'player3' }),
    ).toBe('unknown_action_type');
  });

  it('never queues a rejected action', () => {
    const engine = createEngine();
    engine.submitAction({ type: 'kill', actor: 'player9', target: 'player1' });
    engine.submitAction({ type: 'dance', actor: 'player2' });

    expect(engine.state.pendingActions).toEqual([]);
  });

  it('drains the queue, handing it over and leaving nothing behind', () => {
    const engine = createEngine();
    const kill: Action = { type: 'kill', actor: 'player1', target: 'player5' };
    const vote: Action = { type: 'vote', actor: 'player9', target: 'player2' };
    engine.submitAction(kill);
    engine.submitAction(vote);

    expect(engine.drainActions()).toEqual([kill, vote]);
    expect(engine.state.pendingActions).toEqual([]);
    expect(engine.drainActions()).toEqual([]);
  });
});
