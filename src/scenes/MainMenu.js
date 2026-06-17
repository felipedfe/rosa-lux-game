export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;



        const balao = this.add.image(0, 0, 'balao').setOrigin(0.5).setScale(0.95);
        const balaoTexto = this.add.text(0, -20, "Those who don't question the path end up trapped in it.\n\nThe way out exists… play to find it.", {
            fontSize: '34px',
            fontFamily: '"Shadows Into Light", cursive',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 240 },
            lineSpacing: -10,
        }).setOrigin(0.5);

        // container do balão -> balão + frase
        const balaoGroup = this.add.container((width / 2) - 70, (height / 2) - 200, [balao, balaoTexto])
            .setAlpha(0);

        const rosaParte = this.add.image(0, 0, 'rosa-ilustra').setOrigin(0.5)
        // .setVisible(false);
        const bracoEsq  = this.add.image(0, 60, 'braco-esq').setOrigin(0, 0);
        const bracoDir  = this.add.image(-200, -50, 'braco-dir').setOrigin(0, 0);

        this.add.container((width / 2) + 100, height - 310, [rosaParte, bracoEsq, bracoDir])
            .setScale(0.9);

        this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: () => {
                this.tweens.add({
                    targets: [bracoEsq, bracoDir],
                    angle: 5,
                    duration: 60,
                    ease: 'Sine.InOut',
                    yoyo: true,
                    repeat: 3,
                });
            },
        });

        // surge com delay e flutua em loop
        this.tweens.add({
            targets: balaoGroup,
            alpha: 1,
            duration: 600,
            delay: 300,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: balaoGroup,
                    y: balaoGroup.y - 10,
                    duration: 1800,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                });
            },
        });

        // título
        // this.add.text(width / 2, height / 2 - 403, 'Rosa Lux', {
        //     fontSize: '36px',
        //     fontFamily: 'Georgia, serif',
        //     fontStyle: 'italic',
        //     color: '#e5e7db',
        // }).setOrigin(0.5);

        // botão jogar
        this.add.image(width / 2, height / 2 + 365, 'botao-jogar')
            .setOrigin(0.5)
            .setScale(0.9)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('Game'));
    }
}
