const DEBUG = true;

const ROOM_WIDTH = 540;
const ROOM_HEIGHT = 960;
const WORLD_WIDTH = ROOM_WIDTH * 3;

// centro X de cada sala no mundo
const ROOMS = [
    ROOM_WIDTH * 0 + ROOM_WIDTH / 2,  // 270  — Porta + Casaco
    ROOM_WIDTH * 1 + ROOM_WIDTH / 2,  // 810  — Mesa + Máquina
    ROOM_WIDTH * 2 + ROOM_WIDTH / 2,  // 1350 — Estante
];

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, ROOM_HEIGHT);

        this.state = {
            typewriterRead: false,
            pocketOpen: false,
            chaveObtida: false,
            step: 0, // 0=início 1=casaco 2=livros 3=vaso
        };

        this.currentRoom = 1;
        this.isTransitioning = false;

        this.createRooms();
        this.createNavArrows();
        this.createSwipeInput();
        this.createPopupLayer();
        this.createEndScreen();

        // começa na sala central (Mesa + Máquina)
        this.cameras.main.setScroll(ROOM_WIDTH, 0);
    }

    // ─── Salas ────────────────────────────────────────────────

    createRooms() {
        const R0 = ROOM_WIDTH * 0;
        const R1 = ROOM_WIDTH * 1;
        const R2 = ROOM_WIDTH * 2;
        const cx = ROOM_WIDTH / 2; // centro local de cada sala

        // ── Sala 0 — Porta + Casaco ──────────────────────────
        this.chao = this.add.image(0, 850, 'chao').setOrigin(0)

        this.porta = this.add.image(R0 + cx + 80, 500, 'porta')
            .setOrigin(0.5)
            .setScale(0.7);

        // cabideiro
        this.add.image(R0 + cx - 160, 580, 'cabideiro').setOrigin(0.5).setScale(0.8);

        // chapéu
        this.add.image(R0 + cx - 230, 350, 'chapeu').setOrigin(0.5).setScale(0.5).setAngle(-75).setFlipX(true);

        // container do casaco
        this.casaco = this.add.image(0, 0, 'casaco')
            .setOrigin(0.5)
            .setScale(0.8)
            .setInteractive(new Phaser.Geom.Rectangle(0, 0, 210, 790), Phaser.Geom.Rectangle.Contains);
        //  Rectangle(x, y, largura, altura) — coords no espaço da imagem bruta (265×790)
        this.casaco.on('pointerdown', () => this.onCasacoTap());

        this.bolso = this.add.image(0, 0, 'bolso')
            .setOrigin(0.5)
            .setAlpha(0)
            .setVisible(false);

        this.folhaCasaco = this.add.image(0, -120, 'folha-casaco')
            .setOrigin(0.5)
            .setAlpha(0)
            .setVisible(false);

        // subcontainer do bolso -> bolso + bilhete juntos
        this.bolsoGroup = this.add.container(15, 200, [
            this.folhaCasaco,
            this.bolso,
        ]).setScale(0.3);

        this.casacoGroup = this.add.container(R0 + cx - 160, 580, [
            this.casaco,
            this.bolsoGroup,
        ]).setVisible(false); // revelado após ler o papel da máquina

        // ── Sala 1 — Mesa + Máquina ──────────────────────────
        this.add.image(R1 + cx, 780, 'mesa').setOrigin(0.5);

        // quadro
        this.add.image(R1 + cx + 50, 200, 'suprematismo').setOrigin(0.5).setScale(0.5);

        // folhaMaquina antes da maquina no array = fica atrás
        this.folhaMaquina = this.add.image(0, -80, 'folha-maquina')
            .setOrigin(0.5)
            .setScale(0.7);

        this.maquina = this.add.image(0, 0, 'maquina')
            .setOrigin(0.5)
            .setScale(0.85)
            .setInteractive(new Phaser.Geom.Rectangle(25, 25, 350, 230), Phaser.Geom.Rectangle.Contains);
        //  Rectangle(x, y, largura, altura) — coords no espaço da imagem bruta (400×292)
        this.maquina.on('pointerdown', () => this.onMaquinaTap());

        // chave — criada antes do vaso para ficar atrás, começa invisível
        this.chave = this.add.image(250, 60, 'chave')
            .setOrigin(0.5)
            .setScale(0.4)
            .setVisible(false);

        this.vaso = this.add.image(250, 0, 'vaso')
            .setOrigin(0.5)
            .setScale(0.6)
            .setVisible(false) // revelado após ler os livros
            .setInteractive(new Phaser.Geom.Rectangle(30, 0, 200, 350), Phaser.Geom.Rectangle.Contains);
        //  Rectangle(x, y, largura, altura) — coords no espaço da imagem bruta (286×350)
        this.vaso.on('pointerdown', () => this.onVasoTap());

        // container — ajuste setScale para redimensionar folha + máquina juntas
        this.maquinaGroup = this.add.container((R1 + cx) - 50, 520, [
            this.folhaMaquina,
            this.maquina,
            this.chave,
            this.vaso,
        ]);
        this.maquinaGroup.setScale(0.9);


        // ── Sala 2 — Estante ─────────────────────────────────
        this.estante = this.add.image(0, 0, 'estante').setOrigin(0.5).setScale(0.7);

        this.livros = this.add.image(100, -180, 'livros')
            .setOrigin(0.5)
            .setScale(0.5)
            .setVisible(false) // revelado após ler o bilhete do casaco
            .setInteractive();
        this.livros.on('pointerdown', () => this.onLivrosTap());

        // container estante + livro
        this.estanteGroup = this.add.container(R2 + cx + 50, 480, [
            this.estante,
            this.livros,
        ]);

        if (DEBUG) {
            this.input.enableDebug(this.maquina);
            this.input.enableDebug(this.casaco);
            this.input.enableDebug(this.livros);
            this.input.enableDebug(this.vaso);
            this.input.enableDebug(this.porta);
        }
    }

    // ─── Navegação ────────────────────────────────────────────

    createNavArrows() {
        const { width, height } = this.scale;
        const y = height / 2;

        this.arrowLeft = this.add.image(30, y, 'seta')
            .setOrigin(0.5)
            .setScale(0.15)
            .setFlipX(true)
            .setScrollFactor(0)
            .setDepth(5)
            .setInteractive(
                new Phaser.Geom.Rectangle(-70, -100, 300, 350),
                Phaser.Geom.Rectangle.Contains
                //  Rectangle(x, y, largura, altura) — coords no espaço da imagem bruta (200×154)
            )
            .on('pointerdown', () => this.navigateTo(this.currentRoom - 1));

        this.arrowRight = this.add.image(width - 30, y, 'seta')
            .setOrigin(0.5)
            .setScale(0.15)
            .setScrollFactor(0)
            .setDepth(5)
            .setInteractive(
                new Phaser.Geom.Rectangle(0, -100, 280, 350),
                Phaser.Geom.Rectangle.Contains
                //  Rectangle(x, y, largura, altura) — coords no espaço da imagem bruta (200×154)
            )
            .on('pointerdown', () => this.navigateTo(this.currentRoom + 1));

        this.updateArrows();

        if (DEBUG) {
            this.input.enableDebug(this.arrowLeft);
            this.input.enableDebug(this.arrowRight);
        }
    }

    navigateTo(room) {
        if (this.isTransitioning) return;
        if (room < 0 || room > 2) return;

        this.isTransitioning = true;
        this.currentRoom = room;
        this.updateArrows();

        this.cameras.main.pan(
            ROOMS[room],
            ROOM_HEIGHT / 2,
            500,
            'Power2',
            false,
            (_cam, progress) => {
                if (progress === 1) this.isTransitioning = false;
            }
        );
    }

    updateArrows() {
        this.arrowLeft.setVisible(this.currentRoom > 0);
        this.arrowRight.setVisible(this.currentRoom < 2);
    }

    // ─── Swipe ────────────────────────────────────────────────

    createSwipeInput() {
        let startX = null;

        this.input.on('pointerdown', (p) => { startX = p.x; });

        this.input.on('pointerup', (p) => {
            if (startX === null) return;            // pointerup sem pointerdown nesta cena
            if (this.popupOverlay.visible) return;  // ignora swipe com popup aberto
            const dist = startX - p.x;
            startX = null;
            if (Math.abs(dist) < 60) return;        // ignora taps
            this.navigateTo(dist > 0 ? this.currentRoom + 1 : this.currentRoom - 1);
        });
    }

    // ─── Interações ───────────────────────────────────────────

    onMaquinaTap() {
        if (this.state.typewriterRead) return;
        this.state.typewriterRead = true;
        this.sound.play('maquina-plim')

        this.tweens.add({
            targets: this.folhaMaquina,
            y: '-=120',
            duration: 800,
            ease: 'Back.Out',
            onComplete: () => {
                this.folhaMaquina.setInteractive();
                this.folhaMaquina.on('pointerdown', () => this.onFolhaMaquinaTap());
                if (DEBUG) this.input.enableDebug(this.folhaMaquina);
            }
        });
    }

    onFolhaMaquinaTap() {
        this.showPopup(
            '"Mesmo aqui, continuo\nouvindo os pássaros."',
            'Se for sair, leve um casaco.'
        );
        this.unlockCasaco();
    }

    onCasacoTap() {
        if (this.state.pocketOpen) return;
        this.state.pocketOpen = true;

        this.bolso.setVisible(true);
        this.tweens.add({
            targets: this.bolso,
            alpha: 1,
            duration: 400,
            onComplete: () => {
                this.folhaCasaco.setVisible(true);
                this.tweens.add({
                    targets: this.folhaCasaco,
                    alpha: 1,
                    duration: 300,
                    onComplete: () => {
                        this.folhaCasaco
                            // .setScale(0.6)
                            .setInteractive()
                            .on('pointerdown', () => this.onBilheteTap());

                        if (DEBUG) this.input.enableDebug(this.folhaCasaco);
                    }
                });
            }
        });
    }

    onBilheteTap() {
        this.showPopup(
            '"Liberdade é sempre a liberdade\nde quem pensa diferente."',
            'meu maior legado foram os pensamentos que deixei'
        );
        this.unlockLivros();
    }

    onLivrosTap() {
        this.showPopup(
            '"Às vezes penso que o mundo\nperdeu a delicadeza."',
            'Às vezes os objetos guardam mais do que parecem.'
        );
        this.unlockVaso();
    }

    // ─── Unlocks ──────────────────────────────────────────────

    unlockCasaco() {
        if (this.state.step > 0) return;
        this.state.step = 1;
        this.casacoGroup.setVisible(true).setAlpha(0);
        this.tweens.add({ targets: this.casacoGroup, alpha: 1, duration: 600 });
    }

    unlockLivros() {
        if (this.state.step > 1) return;
        this.state.step = 2;
        this.livros.setVisible(true).setAlpha(0);
        this.tweens.add({ targets: this.livros, alpha: 1, duration: 600 });
    }

    unlockVaso() {
        if (this.state.step > 2) return;
        this.state.step = 3;
        this.vaso.setVisible(true).setAlpha(0);
        this.tweens.add({ targets: this.vaso, alpha: 1, duration: 600 });
    }

    onVasoTap() {
        if (this.state.chaveObtida) return;

        // vaso sobe para revelar a chave
        this.tweens.add({
            targets:  this.vaso,
            y:        -100,
            duration: 400,
            ease:     'Power2',
            onComplete: () => {
                // chave aparece
                this.chave.setVisible(true).setAlpha(0);
                this.tweens.add({
                    targets:  this.chave,
                    alpha:    1,
                    duration: 400,
                    onComplete: () => {
                        this.chave
                            .setInteractive(new Phaser.Geom.Rectangle(0, 0, 300, 122), Phaser.Geom.Rectangle.Contains);
                        //  Rectangle — coords na imagem bruta (300×122)
                        this.chave.on('pointerdown', () => this.onChaveTap());
                        if (DEBUG) this.input.enableDebug(this.chave);
                    }
                });
            }
        });
    }

    onChaveTap() {
        if (this.state.chaveObtida) return;
        this.state.chaveObtida = true;

        this.chave.disableInteractive();
        this.tweens.add({ targets: this.chave, alpha: 0, duration: 300,
            onComplete: () => this.chave.setVisible(false)
        });

        this.showPopup('Você encontrou a chave!', 'Volte até a porta.');

        // porta fica interativa
        this.porta
            .setInteractive(new Phaser.Geom.Rectangle(0, 0, this.porta.width, this.porta.height), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', () => this.onPortaTap());
    }

    onPortaTap() {
        if (!this.state.chaveObtida) return;

        this.porta.setTexture('porta-aberta').disableInteractive();

        // pan até a porta, depois zoom
        this.cameras.main.pan(this.porta.x, this.porta.y, 900, 'Power2', false, (_cam, progress) => {
            if (progress !== 1) return;
            this.cameras.main.zoomTo(3, 2500, 'Power3', false, (_cam2, p2) => {
                if (p2 >= 0.3) this.showEndScreen();
            });
        });
    }

    // ─── Tela final ───────────────────────────────────────────

    createEndScreen() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        this.endOverlay = this.add.rectangle(cx, cy, width, height, 0x000000, 1)
            .setScrollFactor(0).setVisible(false).setDepth(20);

        this.endLogo = this.add.image(cx, cy - 60, 'logo')
            .setOrigin(0.5)
            .setScrollFactor(0).setVisible(false).setDepth(21);

        this.endBtn = this.add.text(cx, cy + 160, 'Conheça nossa biblioteca', {
            fontSize: '20px',
            fontFamily: 'sans-serif',
            color: '#e5e7db',
            backgroundColor: '#e03420',
            padding: { x: 24, y: 12 },
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(21)
            .setInteractive()
            .on('pointerdown', () => {
                window.open('https://rosalux.org.br/biblioteca/', '_blank');
            });
    }

    showEndScreen() {
        this.cameras.main.resetFX();
        this.cameras.main.setZoom(1);
        this.cameras.backgroundColor = '#000000';

        this.endOverlay.setVisible(true).setAlpha(1);
        // this.tweens.add({
        //     targets:  this.endOverlay,
        //     alpha:    1,
        //     duration: 400,
        //     onComplete: () => {
        //         this.endLogo.setVisible(true).setAlpha(0);
        //         this.endBtn.setVisible(true).setAlpha(0);
        //         this.tweens.add({
        //             targets:  [this.endLogo, this.endBtn],
        //             alpha:    1,
        //             duration: 400,
        //         });
        //     }
        // });
        this.endLogo.setVisible(true).setAlpha(1);
        this.endBtn.setVisible(true).setAlpha(1);
        // this.tweens.add({
        //     targets:  [this.endLogo, this.endBtn],
        //     alpha:    1,
        //     duration: 400,
        // });
    }

    // ─── Popup ────────────────────────────────────────────────

    createPopupLayer() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        this.popupOverlay = this.add.rectangle(cx, cy, width, height, 0x000000, 0.75)
            .setScrollFactor(0).setVisible(false).setDepth(10);

        this.popupBox = this.add.rectangle(cx, cy, width - 60, 340, 0x111111)
            .setScrollFactor(0).setVisible(false).setDepth(11);

        this.popupQuote = this.add.text(cx, cy - 70, '', {
            fontSize: '20px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: '#e5e7db',
            align: 'center',
            wordWrap: { width: width - 100 },
            lineSpacing: 10,
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);

        this.popupInstruction = this.add.text(cx, cy + 60, '', {
            fontSize: '18px',
            fontFamily: 'sans-serif',
            color: '#a8a9ab',
            align: 'center',
            wordWrap: { width: width - 120 },
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);

        this.popupClose = this.add.text(width - 60, cy - 140, '✕', {
            fontSize: '24px',
            fontFamily: 'sans-serif',
            color: '#a8a9ab',
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12)
        this.popupClose.setInteractive(
            new Phaser.Geom.Rectangle(-15, -15, 50, 50),
            Phaser.Geom.Rectangle.Contains
        )
            .on('pointerdown', () => this.hidePopup());

        if (DEBUG) this.input.enableDebug(this.popupClose);
    }

    showPopup(quote, instruction = null) {
        this.popupQuote.setText(quote);
        this.popupInstruction
            .setText(instruction ?? '')
            .setVisible(instruction !== null);

        this.popupOverlay.setVisible(true);
        this.popupBox.setVisible(true);
        this.popupQuote.setVisible(true);
        this.popupClose.setVisible(true);
    }

    hidePopup() {
        [
            this.popupOverlay, this.popupBox,
            this.popupQuote, this.popupInstruction, this.popupClose
        ].forEach(o => o.setVisible(false));
    }
}
