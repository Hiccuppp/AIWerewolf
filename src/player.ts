// src/player.ts

import { GameState, Player, Role } from './types';

export interface PlayerController {
  chooseAction(state: GameState, player: Player): any;
}

export class RandomPlayerController implements PlayerController {
  public chooseAction(state: GameState, player: Player): any {
    const alivePlayers = state.players.filter((p) => p.isAlive);
    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

    if (player.role === Role.WEREWOLF) {
      return { wolfKillId: target.id };
    }
    if (player.role === Role.SEER) {
      return { seerInspectId: target.id };
    }
    // Simple random behavior for others
    return {};
  }
}
