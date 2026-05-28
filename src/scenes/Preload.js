export class Preload extends Phaser.Scene {
    constructor() {
        super('Preload');
    }

    preload() {
        const { width, height } = this.scale;

        const barBg = this.add.rectangle(width / 2, height / 2, 300, 12, 0xa8a9ab);
        const bar = this.add.rectangle(width / 2 - 150, height / 2, 0, 12, 0xe03420);
        bar.setOrigin(0, 0.5);

        this.load.on('progress', (progress) => {
            bar.width = 300 * progress;
        });

        this.load.image('porta',         'assets/porta.webp');
        this.load.image('casaco',        'assets/casaco.webp');
        this.load.image('cabideiro',     'assets/cabideiro.webp');
        this.load.image('bolso',         'assets/bolso.webp');
        this.load.image('folha-casaco',  'assets/folha-casaco.webp');
        this.load.image('mesa',          'assets/mesa.webp');
        this.load.image('folha-maquina', 'assets/folha-maquina.webp');
        this.load.image('estante',       'assets/estante.webp');
        this.load.image('livro',        'assets/livro.webp');
        this.load.image('livro-lapis',          'assets/livro-lapis.webp');
        this.load.image('seta',          'assets/seta.png');
        this.load.image('rosa-ilustra',  'assets/rosa-ilustra.png');
        this.load.image('balao',         'assets/balao.png');
        this.load.image('chave',         'assets/chave.webp');
        this.load.image('porta-aberta',  'assets/porta-aberta2.png');
        this.load.image('fundo',         'assets/fundo.webp');
        this.load.image('logo',          'assets/logo.webp');
        this.load.image('papel-tex',     'assets/papel-tex.webp');
        this.load.image('pista-globo',   'assets/pista-globo.webp');
        this.load.image('livro-aberto',  'assets/livro-aberto.webp');
        this.load.image('poster',  'assets/poster.webp');

        this.load.image('globo',         'assets/globo.webp');
        this.load.image('poster-foice',          'assets/poster-pequeno.png');
        this.load.image('vaso',         'assets/vaso.webp');
        this.load.image('flamula',            'assets/flamula.webp');
        

        this.load.audio('paper',         'assets/audio/paper.m4a');
        this.load.audio('porta-abre',    'assets/audio/porta-abre.m4a');
        this.load.audio('slide',         'assets/audio/slide.m4a');
        this.load.audio('key',         'assets/audio/key.m4a');
    }

    create() {
        this.scene.start('MainMenu');
    }
}
