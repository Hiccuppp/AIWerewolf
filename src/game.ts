// src/game.ts

import { GameState, Role, Player, GamePhase } from './types';

export class WerewolfGame {
  private state: GameState;

  constructor(playerRoles: Role[]) {
    this.state = {
      players: playerRoles.map((role, index) => ({
        id: index,
        role,
        isAlive: true,
        isPoisoned: false,
        isProtected: false,
        isWitched: false,
      })),
      phase: GamePhase.NIGHT,
      dayCount: 0,
      winner: null,
      logs: [],
    };
  }

  public getState(): GameState {
    return this.state;
  }

  public log(message: string): void {
    this.state.logs.push(`[Day ${this.state.dayCount}][${this.state.phase}] ${message}`);
  }

  public nextPhase(): void {
    switch (this.state.phase) {
      case GamePhase.NIGHT:
        this.state.phase = GamePhase.DAY;
        break;
      case GamePhase.DAY:
        this.state.phase = GamePhase.VOTING;
        break;
      case GamePhase.VOTING:
        this.state.dayCount++;
        this.state.phase = GamePhase.NIGHT;
        break;
    }
  }

  public checkGameOver(): boolean {
    const alivePlayers = this.state.players.filter((p) => p.isAlive);
    const wolves = alivePlayers.filter((p) => p.role === Role.WEREWOLF);
    const villagers = alivePlayers.filter((p) => p.role !== Role.WEREWOLF);

    if (wolves.length === 0) {
      this.state.winner = 'villagers';
      return true;
    }
    if (wolves.length >= villagers.length) {
      this.state.winner = 'wolves';
      return true;
    }
    return false;
  }
}
