// src/abilities.ts

import { GameState, Role, Player } from './types';
import { WerewolfGame } from './game';

export class AbilityManager {
  public static executeNightActions(game: WerewolfGame, actions: { wolfKillId: number, seerInspectId: number | null, witchAction: 'heal' | 'poison' | null, witchTargetId: number | null, guardTargetId: number | null }): void {
    const state = game.getState();
    const players = state.players;

    // 1. Guard Protect
    if (actions.guardTargetId !== null) {
      players[actions.guardTargetId].isProtected = true;
    }

    // 2. Wolves Kill
    let target = players[actions.wolfKillId];
    if (!target.isProtected) {
      target.isAlive = false;
      game.log(`Player ${target.id} was killed by wolves.`);
    } else {
      game.log(`Player ${target.id} was protected by the guard.`);
    }

    // 3. Witch Action
    if (actions.witchAction === 'heal') {
        const healed = players[actions.witchTargetId!];
        healed.isAlive = true;
        game.log(`Player ${healed.id} was saved by the witch.`);
    } else if (actions.witchAction === 'poison') {
        const poisoned = players[actions.witchTargetId!];
        poisoned.isAlive = false;
        game.log(`Player ${poisoned.id} was poisoned by the witch.`);
    }

    // 4. Seer Inspect (No state impact on players, just logic log)
    if (actions.seerInspectId !== null) {
      const inspected = players[actions.seerInspectId];
      game.log(`Seer inspected player ${inspected.id}.`);
    }
  }
}
