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
            ticketRead: false,
        };

        this.currentRoom = 1;
        this.isTransitioning = false;

        this.createRooms();
        this.createNavArrows();
        this.createPopupLayer();

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
        this.add.image(R0 + cx + 80, 500, 'porta').setOrigin(0.5).setScale(0.7);

        // container do cabide — mova só este para reposicionar tudo junto
        this.cabide = this.add.image(0, 0, 'cabide-casaco')
            .setOrigin(0.5)
            .setScale(0.8)
            .setInteractive();
        this.cabide.on('pointerdown', () => this.onCasacoTap());

        this.bolso = this.add.image(-15, 150, 'bolso')
            .setOrigin(0.5)
            .setScale(0.5)
            .setAlpha(0)
            .setVisible(false);

        this.folhaCasaco = this.add.image(-15, 170, 'folha-casaco')
            .setOrigin(0.5)
            .setScale(0.4)
            .setAlpha(0)
            .setVisible(false);

        this.casacoGroup = this.add.container(R0 + cx - 160, 580, [
            this.cabide,
            this.bolso,
            this.folhaCasaco,
        ]);

        // ── Sala 1 — Mesa + Máquina ──────────────────────────
        this.add.image(R1 + cx, 780, 'mesa').setOrigin(0.5);

        this.folhaMaquina = this.add.image(R1 + cx, 440, 'folha-maquina')
            .setOrigin(0.5)
            .setScale(0.7)
            .setDepth(1);

        this.maquina = this.add.image(R1 + cx, 520, 'maquina')
            .setOrigin(0.5)
            .setScale(0.85)
            .setDepth(2)
            .setInteractive();
        this.maquina.on('pointerdown', () => this.onMaquinaTap());

        // ── Sala 2 — Estante ─────────────────────────────────
        this.add.image(R2 + cx, 480, 'estante').setOrigin(0.5)
            .setScale(0.7);

        if (DEBUG) {
            this.input.enableDebug(this.maquina);
            this.input.enableDebug(this.cabide);
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
            .setInteractive()
            .on('pointerdown', () => this.navigateTo(this.currentRoom - 1));

        this.arrowRight = this.add.image(width - 30, y, 'seta')
            .setOrigin(0.5)
            .setScale(0.15)
            .setScrollFactor(0)
            .setDepth(5)
            .setInteractive()
            .on('pointerdown', () => this.navigateTo(this.currentRoom + 1));

        this.updateArrows();
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

    // ─── Interações ───────────────────────────────────────────

    onMaquinaTap() {
        if (this.state.typewriterRead) return;
        this.state.typewriterRead = true;

        this.tweens.add({
            targets: this.folhaMaquina,
            y: '-=120',
            duration: 800,
            ease: 'Back.Out',
            onComplete: () => {
                this.showPopup(
                    '"Mesmo aqui, continuo\nouvindo os pássaros."',
                    'Se for sair, leve um casaco.'
                );
            }
        });
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
        if (this.state.ticketRead) return;
        this.state.ticketRead = true;

        this.showPopup(
            '"Liberdade é sempre a liberdade\nde quem pensa diferente."',
            'meu maior legado foram os pensamentos que deixei'
        );
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

        this.popupInstruction = this.add.text(cx, cy + 100, '', {
            fontSize: '16px',
            fontFamily: 'sans-serif',
            color: '#a8a9ab',
            align: 'center',
            wordWrap: { width: width - 120 },
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);

        this.popupClose = this.add.text(cx, cy + 145, '[ fechar ]', {
            fontSize: '14px',
            fontFamily: 'sans-serif',
            color: '#a8a9ab',
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12)
            .setInteractive()
            .on('pointerdown', () => this.hidePopup());
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
