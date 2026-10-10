import type { PlayerController } from '../controller/PlayerController.js';
import type { GameEvent } from './event.js';
import type { Faction } from './faction.js';
import type { Phase } from './phase.js';
import type { Role } from './role.js';

/**
 * PlayerState — the player record stored inside GameState (architecture §6).
 *
 * Only an id. The role is stored as `roleId` and resolved against the role
 * catalog, so roles stay configuration (§4) and GameState stays serialisable.
 * The role IS true state here; what keeps it secret is that controllers never
 * receive GameState — only a PlayerView (§7).
 */
export interface PlayerState {
  readonly id: string;
  readonly seat: number;
  readonly roleId: string;
  readonly alive: boolean;
}

/**
 * Player — the runtime binding of a player (architecture §5).
 *
 * Assembled by the engine: persisted state + resolved role + the controller
 * that makes decisions for this seat. Controllers are runtime objects, so they
 * are deliberately kept out of GameState.
 *
 * `memory?: PlayerMemory` from §5 is NOT declared yet: §14 forbids complex AI
 * memory and its shape is only determined once the LLM phase exists. Adding a
 * placeholder now would be inventing an abstraction.
 */
export interface Player {
  readonly id: string;
  readonly seat: number;
  readonly role: Role;
  readonly alive: boolean;
  readonly controller: PlayerController;
}

/**
 * PublicPlayer — everything every player is allowed to know about another
 * player. Note the absence of `roleId`: leaking it here would defeat §7.
 */
export interface PublicPlayer {
  readonly id: string;
  readonly seat: number;
  readonly alive: boolean;
}

/**
 * PlayerView — the ONLY thing a controller or an Observer may read
 * (architecture §7, "整个项目最重要部分").
 *
 * Shaped after the §7 examples:
 *   wolf     -> { role: 'wolf', teammates: [...], publicEvents: [...] }
 *   seer     -> { role: 'seer', checkResults: { player5: 'wolf' } }
 *   villager -> { role: 'villager' }
 *   observer -> { publicEvents: [...] }
 *
 * The view is a detached snapshot: it contains no reference back to GameState,
 * no other player's role, and no `god`-visibility event.
 */
export interface PlayerView {
  readonly playerId: string;
  readonly seat: number;
  readonly roleId: string;
  readonly faction: Faction;
  readonly alive: boolean;
  readonly round: number;
  readonly phase: Phase;

  /** Public knowledge about every seat, including this one. */
  readonly players: readonly PublicPlayer[];

  /** Fellow wolves by player id. Empty for every non-wolf role. */
  readonly teammates: readonly string[];

  /** This player's own check results, keyed by the checked player id. */
  readonly checkResults: Readonly<Record<string, Faction>>;

  /** Events visible to everyone. This is also all an Observer ever gets. */
  readonly publicEvents: readonly GameEvent[];

  /** `private` events addressed to this player. */
  readonly privateEvents: readonly GameEvent[];
}
