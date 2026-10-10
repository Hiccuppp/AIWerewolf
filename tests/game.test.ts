// tests/game.test.ts

import { WerewolfGame } from '../src/game';
import { Role } from '../src/types';

describe('WerewolfGame', () => {
  it('should initialize with correct number of players', () => {
    const roles = [Role.WEREWOLF, Role.VILLAGER, Role.VILLAGER, Role.SEER];
    const game = new WerewolfGame(roles);
    expect(game.getState().players.length).toBe(4);
  });

  it('should correctly end game when all wolves are dead', () => {
    const roles = [Role.WEREWOLF, Role.VILLAGER];
    const game = new WerewolfGame(roles);
    
    // Kill the wolf
    game.getState().players[0].isAlive = false;
    
    expect(game.checkGameOver()).toBe(true);
    expect(game.getState().winner).toBe('villagers');
  });
});
