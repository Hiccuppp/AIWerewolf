import type { Action } from '../../src/domain/action.js';
import type {
  PlayerContext,
  PlayerController,
} from '../../src/controller/PlayerController.js';

/**
 * A scripted PlayerController test double.
 *
 * Phase 0 ships no controller implementation (RandomController is Phase 1), so
 * tests need something to prove the controller contract of §11 actually binds
 * to the engine. It records the context it was handed, which is also how the
 * view-isolation tests check what a decision-maker can see.
 */
export class ScriptedController implements PlayerController {
  readonly received: PlayerContext[] = [];
  private readonly action: Action;

  constructor(action: Action) {
    this.action = action;
  }

  async decide(context: PlayerContext): Promise<Action> {
    this.received.push(context);
    return this.action;
  }
}
