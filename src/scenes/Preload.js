import WebFont from 'webfontloader';

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
        this.load.image('porta-rodape',  'assets/porta-rodape-2.webp');
        this.load.image('porta-rodape-parte',  'assets/porta-rodape-parte.webp');
        this.load.image('casaco',        'assets/casaco.webp');
        this.load.image('cabideiro',     'assets/cabideiro.webp');
        this.load.image('bolso',         'assets/bolso.webp');
        this.load.image('pista-casaco',  'assets/pista-casaco.webp');
        this.load.image('mesa',          'assets/mesa.webp');
        this.load.image('mesa-aberta',   'assets/mesa-aberta.webp');
        this.load.image('mosca',         'assets/mosca.webp');
        this.load.image('estante',       'assets/estante.webp');
        this.load.image('livro',        'assets/livro.webp');
        this.load.image('livro-lapis',          'assets/livro-lapis.webp');
        this.load.image('seta',          'assets/seta.png');
        this.load.image('rosa-ilustra',  'assets/rosa-parte.webp');
        this.load.image('braco-esq',     'assets/braco-esq.webp');
        this.load.image('braco-dir',     'assets/braco-dir.webp');
        this.load.image('balao',         'assets/balao.webp');
        this.load.image('chave',         'assets/chave.webp');
        this.load.image('porta-aberta',  'assets/porta-aberta3.png');
        this.load.image('logo',          'assets/logo-rosalux-red.png');
        this.load.image('papel-popup',     'assets/papel-popup.webp');
        this.load.image('pista-globo',   'assets/pista-globo2.webp');
        this.load.image('livro-aberto',  'assets/livro-aberto.webp');
        this.load.image('poster',  'assets/poster-en-2.webp');
        this.load.image('globo',         'assets/globo.webp');
        this.load.image('poster-foice',          'assets/poster-pequeno.png');
        this.load.image('vaso',         'assets/vaso-pt-1.webp');
        this.load.image('planta-vaso',         'assets/vaso-pt-2.webp');
        this.load.image('flamula',            'assets/flamula.webp');
        this.load.image('botao-jogar',        'assets/botao-jogar-en.png');
        this.load.image('oculos',             'assets/oculos2.webp');
        

        this.load.audio('musica-fundo',    'assets/audio/fundo.m4a');
        this.load.audio('paper',           'assets/audio/paper.m4a');
        this.load.audio('porta-abre',      'assets/audio/porta-abre.m4a');
        this.load.audio('slide',           'assets/audio/slide.m4a');
        this.load.audio('key',             'assets/audio/key.m4a');
        this.load.audio('som-gaveta',      'assets/audio/som-gaveta.m4a');
        this.load.audio('som-flamula',     'assets/audio/som-flamula.m4a');
        this.load.audio('som-oculos',      'assets/audio/som-oculos.m4a');
        this.load.audio('som-planta-vaso', 'assets/audio/som-planta-vaso.m4a');
    }

    create() {
        WebFont.load({
            google: { families: ['Shadows Into Light'] },
            active:   () => this.scene.start('MainMenu'),
            inactive: () => this.scene.start('MainMenu'),
        });
    }
}
