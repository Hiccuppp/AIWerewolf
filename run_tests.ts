
import { WerewolfGame } from './src/game';
import { Role } from './src/types';

function testGameInit() {
  const roles = [Role.WEREWOLF, Role.VILLAGER, Role.VILLAGER, Role.SEER];
  const game = new WerewolfGame(roles);
  if (game.getState().players.length === 4) {
    console.log('PASS: testGameInit');
  } else {
    console.log('FAIL: testGameInit');
  }
}

function testGameOver() {
  const roles = [Role.WEREWOLF, Role.VILLAGER];
  const game = new WerewolfGame(roles);
  game.getState().players[0].isAlive = false;
  if (game.checkGameOver() && game.getState().winner === 'villagers') {
    console.log('PASS: testGameOver');
  } else {
    console.log('FAIL: testGameOver');
  }
}

testGameInit();
testGameOver();

