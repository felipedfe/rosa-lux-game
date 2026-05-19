const DEBUG = false;

const ROOM_WIDTH = 540;
const ROOM_HEIGHT = 960;
const WORLD_WIDTH = ROOM_WIDTH * 3;

const ROOMS = [
    ROOM_WIDTH * 0 + ROOM_WIDTH / 2,  // 270  — Porta + Casaco
    ROOM_WIDTH * 1 + ROOM_WIDTH / 2,  // 810  — Mesa + Globo
    ROOM_WIDTH * 2 + ROOM_WIDTH / 2,  // 1350 — Estante
];

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, ROOM_HEIGHT);

        this.state = {
            globoLiftado: false,
            pocketOpen:   false,
            chaveObtida:  false,
            step: 0, // 0=início 1=casaco 2=livros
        };

        this.currentRoom    = 1;
        this.isTransitioning = false;
        this.popupChaveGlow  = null;
        this.folhaGloboGlow  = null;
        this.folhaCasacoGlow = null;

        this.createRooms();
        this.createNavArrows();
        this.createSwipeInput();
        this.createPopupLayer();
        this.createEndScreen();

        // começa na sala central (Mesa + Globo)
        this.cameras.main.setScroll(ROOM_WIDTH, 0);
    }

    // ─── Salas ────────────────────────────────────────────────

    createRooms() {
        const R0 = ROOM_WIDTH * 0;
        const R1 = ROOM_WIDTH * 1;
        const R2 = ROOM_WIDTH * 2;
        const cx = ROOM_WIDTH / 2;

        // ── Sala 0 — Porta + Casaco ──────────────────────────
        this.add.image(0, 850, 'chao').setOrigin(0);

        this.porta = this.add.image(R0 + cx + 80, 500, 'porta')
            .setOrigin(0.5)
            .setScale(0.7);

        this.add.image(R0 + cx - 160, 580, 'cabideiro').setOrigin(0.5).setScale(0.8);
        this.add.image(R0 + cx - 230, 350, 'chapeu').setOrigin(0.5).setScale(0.5).setAngle(-75).setFlipX(true);

        this.casaco = this.add.image(0, 0, 'casaco')
            .setOrigin(0.5)
            .setScale(0.8)
            .setInteractive(new Phaser.Geom.Rectangle(0, 0, 210, 790), Phaser.Geom.Rectangle.Contains);
        //  Rectangle — coords na imagem bruta (265×790)
        this.casaco.on('pointerdown', () => this.onCasacoTap());

        this.bolso = this.add.image(0, 0, 'bolso')
            .setOrigin(0.5).setAlpha(0).setVisible(false);

        this.folhaCasaco = this.add.image(0, -120, 'folha-casaco')
            .setOrigin(0.5).setAlpha(0).setVisible(false);

        this.bolsoGroup = this.add.container(15, 200, [
            this.folhaCasaco,
            this.bolso,
        ]).setScale(0.3);

        this.casacoGroup = this.add.container(R0 + cx - 160, 580, [
            this.casaco,
            this.bolsoGroup,
        ]).setVisible(false); // revelado após ler o papel do globo

        // ── Sala 1 — Mesa + Globo ────────────────────────────
        this.add.image(R1 + cx, 780, 'mesa').setOrigin(0.5);
        this.add.image(R1 + cx + 50, 200, 'suprematismo').setOrigin(0.5).setScale(0.5);

        // poster — texto no lugar da imagem por enquanto
        this.add.text(R1 + cx - 130, 320, '"Quem não se move,\nnão descobre o\npeso do mundo."', {
            fontSize: '16px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: '#e5e7db',
            align: 'center',
            wordWrap: { width: 180 },
            lineSpacing: 6,
        }).setOrigin(0.5);

        // máquina como decoração (não interativa)
        // this.add.image(R1 + cx - 60, 590, 'maquina').setOrigin(0.5).setScale(0.75);

        // vaso como decoração (não interativo)
        this.add.image(R1 + cx + 190, 610, 'vaso').setOrigin(0.5).setScale(0.5);

        // folhaGlobo — fica sob o globo, começa invisível — usa asset folha-maquina
        this.folhaGlobo = this.add.image(R1 + cx + 60, 630, 'folha-maquina')
            .setOrigin(0.5)
            .setScale(0.4)
            .setVisible(false);

        // globo — interativo
        this.globo = this.add.image(R1 + cx + 60, 590, 'globo')
            .setOrigin(0.5)
            .setScale(0.55)
            .setInteractive(new Phaser.Geom.Rectangle(0, 0, 300, 420), Phaser.Geom.Rectangle.Contains);
        //  Rectangle — coords na imagem bruta (300×420)
        this.globo.on('pointerdown', () => this.onGloboTap());

        // ── Sala 2 — Estante ─────────────────────────────────
        this.estante = this.add.image(0, 0, 'estante').setOrigin(0.5).setScale(0.7);

        this.livros = this.add.image(100, -180, 'livros')
            .setOrigin(0.5)
            .setScale(0.5)
            .setVisible(false) // revelado após ler o bilhete do casaco
            .setInteractive();
        this.livros.on('pointerdown', () => this.onLivrosTap());

        this.estanteGroup = this.add.container(R2 + cx + 50, 480, [
            this.estante,
            this.livros,
        ]);

        if (DEBUG) {
            this.input.enableDebug(this.globo);
            this.input.enableDebug(this.casaco);
            this.input.enableDebug(this.livros);
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
            .setInteractive(new Phaser.Geom.Rectangle(-70, -100, 300, 350), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', () => this.navigateTo(this.currentRoom - 1));

        this.arrowRight = this.add.image(width - 30, y, 'seta')
            .setOrigin(0.5)
            .setScale(0.15)
            .setScrollFactor(0)
            .setDepth(5)
            .setInteractive(new Phaser.Geom.Rectangle(0, -100, 280, 350), Phaser.Geom.Rectangle.Contains)
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
            if (startX === null) return;
            if (this.popupOverlay.visible) return;
            const dist = startX - p.x;
            startX = null;
            if (Math.abs(dist) < 60) return;
            this.navigateTo(dist > 0 ? this.currentRoom + 1 : this.currentRoom - 1);
        });
    }

    // ─── Interações ───────────────────────────────────────────

    onGloboTap() {
        if (this.state.globoLiftado) return;
        this.state.globoLiftado = true;

        this.tweens.add({
            targets:  this.globo,
            y:        '-=130',
            duration: 500,
            ease:     'Power2',
            onComplete: () => {
                this.folhaGlobo.setVisible(true).setAlpha(0);
                this.tweens.add({
                    targets:  this.folhaGlobo,
                    alpha:    1,
                    duration: 400,
                    onComplete: () => {
                        this.folhaGlobo.setInteractive();
                        this.folhaGlobo.on('pointerdown', () => this.onFolhaGloboTap());
                        this.folhaGloboGlow = this.addPersistentGlow(this.folhaGlobo);
                        if (DEBUG) this.input.enableDebug(this.folhaGlobo);
                    }
                });
            }
        });
    }

    onFolhaGloboTap() {
        if (this.folhaGloboGlow) {
            this.folhaGlobo.postFX.remove(this.folhaGloboGlow);
            this.folhaGloboGlow = null;
        }
        this.showPopup(
            '"A barbárie não chega vestida\nde monstro. Às vezes chega como\nmercado, ordem, pátria e guerra."',
            'Se for sair, leve um casaco.'
        );
        this.unlockCasaco();
    }

    onCasacoTap() {
        if (this.state.pocketOpen) return;
        this.state.pocketOpen = true;

        this.bolso.setVisible(true);
        this.tweens.add({
            targets:  this.bolso,
            alpha:    1,
            duration: 400,
            onComplete: () => {
                this.folhaCasaco.setVisible(true);
                this.tweens.add({
                    targets:  this.folhaCasaco,
                    alpha:    1,
                    duration: 300,
                    onComplete: () => {
                        this.folhaCasaco
                            .setInteractive()
                            .on('pointerdown', () => this.onBilheteTap());
                        this.folhaCasacoGlow = this.addPersistentGlow(this.folhaCasaco);
                        if (DEBUG) this.input.enableDebug(this.folhaCasaco);
                    }
                });
            }
        });
    }

    onBilheteTap() {
        if (this.folhaCasacoGlow) {
            this.folhaCasaco.postFX.remove(this.folhaCasacoGlow);
            this.folhaCasacoGlow = null;
        }
        this.showPopup(
            '"Liberdade é sempre a liberdade\nde quem pensa diferente."',
            'Há mais pensamentos a descobrir.'
        );
        this.unlockLivros();
    }

    onLivrosTap() {
        this.showPopup(
            '"Mover-se com quem pensa diferente\npara impedir a barbárie."',
            null,
            true // mostra chave dentro do popup
        );
    }

    onPortaTap() {
        if (!this.state.chaveObtida) return;

        this.porta.setTexture('porta-aberta').disableInteractive();

        this.cameras.main.pan(this.porta.x, this.porta.y, 900, 'Power2', false, (_cam, progress) => {
            if (progress !== 1) return;
            this.cameras.main.zoomTo(3, 2500, 'Power3', false, (_cam2, p2) => {
                if (p2 >= 0.3) this.showEndScreen();
            });
        });
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

    // ─── Glow ─────────────────────────────────────────────────

    addPersistentGlow(target) {
        const glow = target.postFX.addGlow(0xf7ee43, 4, 0);
        this.tweens.add({
            targets:  glow,
            outerStrength: 0,
            duration: 800,
            yoyo:     true,
            repeat:   -1,
            ease:     'Sine.InOut',
        });
        return glow;
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
            .on('pointerdown', () => window.open('https://rosalux.org.br/biblioteca/', '_blank'));
    }

    showEndScreen() {
        this.cameras.main.resetFX();
        this.cameras.main.setZoom(1);

        this.endOverlay.setVisible(true).setAlpha(1);
        this.endLogo.setVisible(true).setAlpha(1);
        this.endBtn.setVisible(true).setAlpha(1);
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

        // chave dentro do popup — aparece só no popup dos livros
        this.popupChave = this.add.image(cx, cy + 130, 'chave')
            .setOrigin(0.5)
            .setScale(0.45)
            .setScrollFactor(0).setVisible(false).setDepth(13)
            .setInteractive()
            .on('pointerdown', () => this.onPopupChaveTap());

        this.popupClose = this.add.text(width - 60, cy - 140, '✕', {
            fontSize: '24px',
            fontFamily: 'sans-serif',
            color: '#a8a9ab',
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);
        this.popupClose.setInteractive(
            new Phaser.Geom.Rectangle(-15, -15, 50, 50),
            Phaser.Geom.Rectangle.Contains
        ).on('pointerdown', () => this.hidePopup());

        if (DEBUG) {
            this.input.enableDebug(this.popupClose);
            this.input.enableDebug(this.popupChave);
        }
    }

    showPopup(quote, instruction = null, showChave = false) {
        this.popupQuote.setText(quote);
        this.popupInstruction
            .setText(instruction ?? '')
            .setVisible(instruction !== null);

        this.popupOverlay.setVisible(true);
        this.popupBox.setVisible(true);
        this.popupQuote.setVisible(true);
        this.popupClose.setVisible(true);

        if (showChave) {
            this.popupChave.setVisible(true).setAlpha(0);
            this.tweens.add({ targets: this.popupChave, alpha: 1, duration: 300 });
            if (!this.popupChaveGlow) {
                this.popupChaveGlow = this.addPersistentGlow(this.popupChave);
            }
        }
    }

    hidePopup() {
        [
            this.popupOverlay, this.popupBox,
            this.popupQuote, this.popupInstruction, this.popupClose,
        ].forEach(o => o.setVisible(false));

        this.popupChave.setVisible(false);
        if (this.popupChaveGlow) {
            this.popupChave.postFX.remove(this.popupChaveGlow);
            this.popupChaveGlow = null;
        }
    }

    onPopupChaveTap() {
        if (this.state.chaveObtida) return;
        this.state.chaveObtida = true;

        this.hidePopup();
        this.showPopup('Você encontrou a chave!', 'Volte até a porta.');

        this.porta
            .setInteractive(
                new Phaser.Geom.Rectangle(0, 0, this.porta.width, this.porta.height),
                Phaser.Geom.Rectangle.Contains
            )
            .on('pointerdown', () => this.onPortaTap());
    }
}
