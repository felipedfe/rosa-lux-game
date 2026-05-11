export class Preload extends Phaser.Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        const { width, height } = this.scale;

        // barra de loading
        const barBg = this.add.rectangle(width / 2, height / 2, 300, 12, 0x333333);
        const bar = this.add.rectangle(width / 2 - 150, height / 2, 0, 12, 0x591006);
        bar.setOrigin(0, 0.5);

        this.load.on('progress', (progress) => {
            bar.width = 300 * progress;
        });

        // carregue seus assets aqui:
        // this.load.image('key', 'assets/imagem.png');
        // this.load.atlas('atlas', 'assets/atlas.png', 'assets/atlas.json');
        // this.load.audio('som', 'assets/som.mp3');
    }

    create() {
        this.scene.start('MainMenu');
    }
}
