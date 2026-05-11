export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height / 2, 'Game Scene\n(em construção)', {
            fontSize: '24px',
            fontFamily: 'sans-serif',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // toque para voltar ao menu
        this.input.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    update() {}
}
