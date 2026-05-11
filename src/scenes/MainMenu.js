export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height * 0.4, 'Rosa Lux', {
            fontSize: '48px',
            fontFamily: 'sans-serif',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const btnText = this.add.text(width / 2, height * 0.6, 'JOGAR', {
            fontSize: '28px',
            fontFamily: 'sans-serif',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnText.on('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}
