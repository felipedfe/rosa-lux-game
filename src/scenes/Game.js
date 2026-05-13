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
        };

        this.currentRoom = 1;
        this.isTransitioning = false;

        this.createRooms();
        this.createNavArrows();
        this.createSwipeInput();
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

        // cabideiro — criado antes do casacoGroup para ficar atrás
        this.add.image(R0 + cx - 160, 580, 'cabideiro').setOrigin(0.5).setScale(0.8);

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
        ]);

        // ── Sala 1 — Mesa + Máquina ──────────────────────────
        this.add.image(R1 + cx, 780, 'mesa').setOrigin(0.5);

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

        this.vaso = this.add.image(250, 0, 'vaso')
            .setOrigin(0.5)
            .setScale(0.6)
            .setInteractive(new Phaser.Geom.Rectangle(30, 0, 200, 350), Phaser.Geom.Rectangle.Contains);
        //  Rectangle(x, y, largura, altura) — coords no espaço da imagem bruta (286×350)

        // container — ajuste setScale para redimensionar folha + máquina juntas
        this.maquinaGroup = this.add.container((R1 + cx) - 50, 520, [
            this.folhaMaquina,
            this.maquina,
            this.vaso,
        ]);
        this.maquinaGroup.setScale(0.9);


        // ── Sala 2 — Estante ─────────────────────────────────
        this.estante = this.add.image(0, 0, 'estante').setOrigin(0.5).setScale(0.7);

        this.livros = this.add.image(100, -180, 'livros')
            .setOrigin(0.5)
            .setScale(0.5)
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
    }

    onLivrosTap() {
        this.showPopup(
            '"Às vezes penso que o mundo\nperdeu a delicadeza."',
            'colocar dica'
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
