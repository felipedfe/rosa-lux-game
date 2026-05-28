// paleta de cores, além de preto e branco:
// f4efe6 -> bege
// e8442f -> vermelho
// ccc6ba - > cinza claro
// 9a8f7b -> cinza escuro

const DEBUG = true;

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
            pocketOpen: false,
            chaveObtida: false,
            step: 0, // 0=início 1=casaco 2=livros
        };

        this.currentRoom = 1;
        this.isTransitioning = false;
        this.popupChaveGlow = null;
        this.folhaGloboGlow = null;
        this.folhaCasacoGlow = null;
        this.bookPopupChaveGlow = null;

        this.createRooms();
        this.createNavArrows();
        this.createSwipeInput();
        this.createPopupLayer();
        this.createBookPopupLayer();
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

        // fundo — cobre todo o mundo (1620×960)
        // this.add.image(0, 0, 'fundo').setOrigin(0).setDisplaySize(WORLD_WIDTH, ROOM_HEIGHT);

        // ── Sala 0 — Porta + Casaco ──────────────────────────

        this.porta = this.add.image(R0 + cx + 80, 530, 'porta')
            .setOrigin(0.5)
            .setScale(0.65);

        // maçanetas — zonas horizontais sobre a porta, sempre interativas
        // ajuste x/y/w/h com DEBUG=true para encaixar nas maçanetas da imagem
        this.macanetaEsq = this.add.zone(R0 + cx - 40, 570, 60, 60).setInteractive();
        this.macanetaMeio = this.add.zone(R0 + cx + 80, 570, 60, 60).setInteractive();
        this.macanetaDir = this.add.zone(R0 + cx + 200, 570, 60, 60).setInteractive();

        this.macanetaEsq.on('pointerdown', () => {
            if (this.state.chaveObtida) this.onPortaTap();
            else this.onMacanetaErradaTap();
        });
        this.macanetaMeio.on('pointerdown', () => this.onMacanetaErradaTap());
        this.macanetaDir.on('pointerdown', () => this.onMacanetaErradaTap());

        if (DEBUG) {
            this.input.enableDebug(this.macanetaEsq);
            this.input.enableDebug(this.macanetaMeio);
            this.input.enableDebug(this.macanetaDir);
        }

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
            .setOrigin(0.5).setScale(0.9).setAlpha(0).setVisible(false);

        this.bolsoGroup = this.add.container(15, 200, [
            this.folhaCasaco,
            this.bolso,
        ]).setScale(0.3);

        this.casacoGroup = this.add.container(R0 + cx - 160, 580, [
            this.casaco,
            this.bolsoGroup,
        ]).setVisible(false); // revelado após ler o papel do globo

        // ── Sala 1 — Mesa + Globo ────────────────────────────
        this.add.image(R1 + cx, 710, 'mesa').setOrigin(0.5).setScale(0.8);
        this.add.image(R1 + cx + 90, 230, 'poster').setOrigin(0.5).setScale(0.55);

        this.add.image(R1 + 20, 40, 'quadro').setOrigin(0).setScale(0.4);

        // vaso
        this.add.image(R1 + cx + 140, 500, 'vaso').setOrigin(0.5).setScale(0.5);

        // folhaGlobo — pista, fica atrás do globo no container (ordem importa)
        this.folhaGlobo = this.add.image(0, 90, 'pista-globo')
            .setOrigin(0.5)
            .setScale(0.4)
            .setAlpha(0);

        // globo — interativo, renderizado na frente por ser adicionado depois
        this.globo = this.add.image(0, 0, 'globo')
            .setOrigin(0.5)
            .setScale(0.8)
            .setInteractive();
            // .setInteractive({ pixelPerfect: true });
        this.globo.on('pointerdown', () => this.onGloboTap());

        // container — mover globoGroup reposiciona globo e pista juntos
        this.globoGroup = this.add.container(R1 + cx - 100, 480, [
            this.folhaGlobo,
            this.globo,
        ]);

        // ── Sala 2 — Estante ─────────────────────────────────
        this.add.image(R2 + cx + 120, 70, 'relogio').setOrigin(0.5).setScale(0.4);

        this.estante = this.add.image(0, 0, 'estante').setOrigin(0.5).setScale(0.7);

        this.livros = this.add.image(140, -235, 'livros')
            .setOrigin(0.5)
            .setScale(0.7)
            .setVisible(false) // revelado após ler o bilhete do casaco
            .setInteractive();
        this.livros.on('pointerdown', () => this.onLivrosTap());

        this.estanteGroup = this.add.container(R2 + cx + 50, 520, [
            this.estante,
            this.livros,
        ]);

        this.add.image(R2 + ROOM_WIDTH + 40, 980, 'mala').setOrigin(1, 1).setScale(0.9);

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
            // .setOrigin(0.5)
            .setScale(0.45)
            .setFlipX(true) 
            .setScrollFactor(0)
            .setDepth(5)
            .setInteractive(new Phaser.Geom.Rectangle(-10, -30, 110, 150), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', () => this.navigateTo(this.currentRoom - 1));

        this.arrowRight = this.add.image(width - 30, y, 'seta')
            // .setOrigin(0.5)
            .setScale(0.45)
            .setScrollFactor(0)
            .setDepth(5)
            .setInteractive(new Phaser.Geom.Rectangle(-10, -30, 110, 150), Phaser.Geom.Rectangle.Contains)
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

        this.sound.play('slide', {
            volume: 0.4,
            rate: 1.5,
        });
        this.state.globoLiftado = true;

        this.tweens.add({
            targets: this.globo,
            x: '+=130',
            duration: 500,
            ease: 'Power2',
        });
        this.tweens.add({
            targets: this.folhaGlobo,
            alpha: 1,
            duration: 400,
            delay: 100,
            ease: 'Sine.easeIn',
            onComplete: () => {
                this.folhaGlobo.setInteractive();
                this.folhaGlobo.on('pointerdown', () => this.onFolhaGloboTap());
                this.folhaGloboGlow = this.addPersistentGlow(this.folhaGlobo);
                if (DEBUG) this.input.enableDebug(this.folhaGlobo);
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
        this.showBookPopup('"Mover-se com quem pensa diferente\npara impedir a barbárie."');
    }

    onMacanetaErradaTap() {
        this.tweens.add({
            targets: this.porta,
            x: '+=3',
            duration: 30,
            yoyo: true,
            repeat: 3,
        });
    }

    onPortaTap() {
        if (!this.state.chaveObtida) return;

        [this.macanetaEsq, this.macanetaMeio, this.macanetaDir].forEach(z => z.disableInteractive());
        this.sound.play('porta-abre');
        this.porta.setTexture('porta-aberta');

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
            targets: glow,
            outerStrength: 0,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
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

        this.endBtn = this.add.text(cx, cy + 160, 'Conheça o legado revolucionário de Rosa Luxemburgo ▶', {
            fontSize: '20px',
            fontFamily: 'sans-serif',
            color: '#e5e7db',
            backgroundColor: '#e03420',
            padding: { x: 24, y: 12 },
            wordWrap: { width: 320 },
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(21)
            .setInteractive()
            .on('pointerdown', () => window.open('https://rosaluxemburgo.rosalux.org.br/', '_blank'));
    }

    showEndScreen() {
        this.cameras.main.resetFX();
        this.cameras.main.setZoom(1);

        this.endOverlay.setVisible(true).setAlpha(1);
        this.endLogo.setVisible(true).setAlpha(1);
        this.endBtn.setVisible(true).setAlpha(1);
    }

    // ─── Popup do livro ───────────────────────────────────────

    createBookPopupLayer() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;
        const bookW = width - 40;
        const halfPage = bookW / 4; // distância do centro a cada página

        this.bookPopupBg = this.add.image(cx, cy, 'livro-aberto')
            .setDisplaySize(bookW, 360)
            .setScrollFactor(0).setVisible(false).setDepth(11);

        this.bookPopupQuote = this.add.text(cx - halfPage + 25, cy - 30, '', {
            fontSize: '17px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: '#2c1810',
            align: 'center',
            wordWrap: { width: bookW / 2 - 100 },
            lineSpacing: 8,
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);

        this.bookPopupInstruction = this.add.text(cx - halfPage + 25, cy + 80, '', {
            fontSize: '16px',
            fontFamily: 'sans-serif',
            color: '#5a4a3a',
            align: 'center',
            wordWrap: { width: bookW / 2 - 100 },
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);

        this.bookPopupChave = this.add.image(cx + halfPage, cy, 'chave')
            .setOrigin(0.5)
            .setScale(0.45)
            .setScrollFactor(0).setVisible(false).setDepth(12)
            .setInteractive()
            .on('pointerdown', () => this.onPopupChaveTap());

        this.bookPopupClose = this.add.text(cx + bookW / 2 - 20, cy - 155, '✕', {
            fontSize: '22px',
            fontFamily: 'sans-serif',
            color: '#5a4a3a',
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);
        this.bookPopupClose.setInteractive(
            new Phaser.Geom.Rectangle(-15, -15, 50, 50),
            Phaser.Geom.Rectangle.Contains
        ).on('pointerdown', () => this.hideBookPopup());
    }

    showBookPopup(quote) {
        this.sound.play('paper');
        this.bookPopupQuote.setText(quote).setVisible(true);
        this.bookPopupInstruction.setVisible(false);
        this.popupOverlay.setVisible(true);
        this.bookPopupBg.setVisible(true);
        this.bookPopupClose.setVisible(true);

        if (!this.state.chaveObtida) {
            this.bookPopupChave.setVisible(true).setAlpha(0);
            this.tweens.add({ targets: this.bookPopupChave, alpha: 1, duration: 300 });
            if (!this.bookPopupChaveGlow) {
                this.bookPopupChaveGlow = this.addPersistentGlow(this.bookPopupChave);
            }
        }
    }

    hideBookPopup() {
        [
            this.popupOverlay, this.bookPopupBg,
            this.bookPopupQuote, this.bookPopupInstruction,
            this.bookPopupChave, this.bookPopupClose,
        ].forEach(o => o.setVisible(false));

        if (this.bookPopupChaveGlow) {
            this.bookPopupChave.postFX.remove(this.bookPopupChaveGlow);
            this.bookPopupChaveGlow = null;
        }
    }

    // ─── Popup ────────────────────────────────────────────────

    createPopupLayer() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        this.popupOverlay = this.add.rectangle(cx, cy, width, height, 0x000000, 0.75)
            .setScrollFactor(0).setVisible(false).setDepth(10);

        this.popupBox = this.add.image(cx, cy, 'papel-tex')
            .setDisplaySize(width - 60, 340)
            .setScrollFactor(0).setVisible(false).setDepth(11);

        this.popupQuote = this.add.text(cx, cy - 70, '', {
            fontSize: '20px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: '#2c1810',
            align: 'center',
            wordWrap: { width: width - 100 },
            lineSpacing: 10,
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);

        this.popupInstruction = this.add.text(cx, cy + 60, '', {
            fontSize: '18px',
            fontFamily: 'sans-serif',
            color: '#5a4a3a',
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
            color: '#5a4a3a',
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
        this.sound.play('paper');
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

        this.sound.play('key', {
            volume: 0.4,
            rate: 1.5,
        });
        this.state.chaveObtida = true;

        if (this.bookPopupChaveGlow) {
            this.bookPopupChave.postFX.remove(this.bookPopupChaveGlow);
            this.bookPopupChaveGlow = null;
        }

        this.tweens.add({
            targets: this.bookPopupChave,
            alpha: 0,
            duration: 300,
            onComplete: () => this.bookPopupChave.setVisible(false),
        });

        this.bookPopupQuote.setText('Você encontrou a chave!');
        this.bookPopupInstruction.setText('Volte até a porta.').setVisible(false);

    }
}
