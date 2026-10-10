// src/types.ts

export enum Role {
  WEREWOLF = 'werewolf',
  VILLAGER = 'villager',
  SEER = 'seer',
  WITCH = 'witch',
  GUARD = 'guard',
}

export enum GamePhase {
  NIGHT = 'night',
  DAY = 'day',
  VOTING = 'voting',
  END = 'end',
}

export interface Player {
  id: number;
  role: Role;
  isAlive: boolean;
  isPoisoned: boolean;
  isProtected: boolean;
  isWitched: boolean; // For save/kill ability
}

export interface GameState {
  players: Player[];
  phase: GamePhase;
  dayCount: number;
  winner: 'wolves' | 'villagers' | null;
  logs: string[];
}
