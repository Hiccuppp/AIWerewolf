import type { Action } from '../domain/action.js';
import type { PlayerView } from '../domain/player.js';

/**
 * PlayerContext — everything a controller is given to decide with
 * (architecture §11).
 *
 * It carries a PlayerView and nothing else. The controller has no handle on the
 * engine and no access to GameState, which is what makes the information
 * isolation of §7 structural rather than a convention.
 */
export interface PlayerContext {
  readonly view: PlayerView;
}

/**
 * PlayerController — the decision layer (architecture §11).
 *
 * The engine owns rules, the controller owns decisions, and the two never mix:
 * swapping this implementation is the entire difference between phases.
 *
 *   Phase 1: RandomController
 *   Phase 3: LLMController
 *   Phase 5: HumanReplayController
 *
 * Phase 0 defines the contract only; no implementation exists yet, so nothing
 * here may assume anything about how a decision is produced. The return type is
 * already `Promise` because later controllers are async (an LLM call), and
 * changing that later would break every implementation.
 */
export interface PlayerController {
  decide(context: PlayerContext): Promise<Action>;
}
