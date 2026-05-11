import Phaser from 'phaser';
import { Preload } from './scenes/Preload.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Game } from './scenes/Game.js';

// Resolução base em portrait
const GAME_WIDTH = 540;
const GAME_HEIGHT = 960;

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#591006',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        orientation: Phaser.Scale.PORTRAIT,
        autoRound: true,
    },
    input: {
        activePointers: 3 // suporte a multi-touch
    },
    scene: [Preload, MainMenu, Game]
};

export default new Phaser.Game(config);
