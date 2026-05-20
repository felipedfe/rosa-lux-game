export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        this.add.image((width / 2) - 200, height, 'rosa-ilustra')
            .setOrigin(0.5, 0.5)
            .setScale(1.4);

            const balao = this.add.image(0, 0, 'balao').setOrigin(0.5).setScale(0.7);
            const balaoTexto = this.add.text(0, -20, 'Explore as três áreas do cômodo, encontre as pistas e descubra a chave para sair.', {
                fontSize: '18px',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                color: '#111111',
                align: 'center',
                wordWrap: { width: 250 },
                lineSpacing: 6,
            }).setOrigin(0.5);
            
        // container do balão -> balão + frase
        const balaoGroup = this.add.container((width / 2) + 50, (height / 2) - 150, [balao, balaoTexto])
            .setAlpha(0);

        // surge com delay e flutua em loop
        this.tweens.add({
            targets:  balaoGroup,
            alpha:    1,
            duration: 600,
            delay:    300,
            ease:     'Sine.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets:   balaoGroup,
                    y:         balaoGroup.y - 10,
                    duration:  1800,
                    ease:      'Sine.easeInOut',
                    yoyo:      true,
                    repeat:    -1,
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
        this.add.text(width / 2, height / 2 + 365, 'JOGAR', {
            fontSize: '28px',
            fontFamily: 'sans-serif',
            color: '#e5e7db',
            backgroundColor: '#e03420',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('Game'));
    }
}
