// paleta de cores, além de preto e branco:
// f4efe6 -> bege
// e8442f -> vermelho
// ccc6ba - > cinza claro
// 9a8f7b -> cinza escuro

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
            pocketOpen: false,
            chaveObtida: false,
            step: 0, // 0=início 1=casaco 2=livro
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

        this.sound.play('musica-fundo', { loop: true, volume: 0.25 });
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

        this.porta = this.add.image(-10, 113, 'porta')
            .setOrigin(0.5)
            .setScale(0.85);


        this.portaRodape = this.add.image(80, 430, 'porta-rodape')
            .setOrigin(0.5, 1)
            .setScale(0.85);

        this.portaRodapeParte = this.add.image(-722, 408 , 'porta-rodape-parte')
            .setOrigin(0, 0);

        this.portaGroup = this.add.container(R0 + cx - 90, 375, [
            this.portaRodape,
            this.portaRodapeParte,
            this.porta,
        ]);

        // maçanetas — zonas horizontais sobre a porta, sempre interativas
        // ajuste x/y/w/h com DEBUG=true para encaixar nas maçanetas da imagem
        this.macanetaEsq = this.add.zone(R0 + cx - 195, 490, 60, 80).setInteractive();
        this.macanetaMeio = this.add.zone(R0 + cx - 100, 490, 60, 80).setInteractive();
        this.macanetaDir = this.add.zone(R0 + cx - 5, 490, 60, 80).setInteractive();

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

        this.add.image(R0 + cx + 150, 190, 'cabideiro').setOrigin(0.5).setScale(0.8);

        this.casaco = this.add.image(0, 0, 'casaco')
            .setOrigin(0.5)
            .setScale(0.9)
            .setInteractive(new Phaser.Geom.Rectangle(30, 0, 170, 510), Phaser.Geom.Rectangle.Contains);
        //  Rectangle — coords na imagem bruta (265×790)
        this.casaco.on('pointerdown', () => this.onCasacoTap());

        this.folhaCasaco = this.add.image(5, -20, 'pista-casaco')
            .setOrigin(0.5).setScale(0.5).setVisible(false);

        this.bolso = this.add.image(0, 0, 'bolso')
            .setOrigin(0.5);

        this.bolsoGroup = this.add.container(- 9, 130, [
            this.folhaCasaco,
            this.bolso,
        ]).setScale(0.9);

        this.casacoGroup = this.add.container(R0 + cx + 130, 415, [
            this.casaco,
            this.bolsoGroup,
        ]).setVisible(false); // revelado após ler o papel do globo @aqui

        // ── Sala 1 — Mesa + Globo ────────────────────────────
        this.add.image(R1 + cx, 710, 'mesa').setOrigin(0.5).setScale(0.78);
        this.add.image(R1 + cx - 80, 230, 'poster').setOrigin(0.5).setScale(0.8);

        this.add.image(R1 + cx + 50, 170, 'poster-foice').setOrigin(0).setScale(0.7);

        // livro lãpis
        // this.add.image(R1 + cx + 10, 600, 'livro-lapis').setOrigin(0.5).setScale(0.7);

        // folhaGlobo — pista, fica atrás do globo no container (ordem importa)
        this.folhaGlobo = this.add.image(0, 90, 'pista-globo')
            .setOrigin(0.5)
            .setScale(0.5)
            .setAlpha(0);

        // globo — interativo, renderizado na frente por ser adicionado depois
        this.globo = this.add.image(0, 0, 'globo')
            .setOrigin(0.5)
            .setScale(0.7)
            .setInteractive();
        // .setInteractive({ pixelPerfect: true });
        this.globo.on('pointerdown', () => this.onGloboTap());

        // container — mover globoGroup reposiciona globo e pista juntos
        this.globoGroup = this.add.container(R1 + cx + 120, 480, [
            this.folhaGlobo,
            this.globo,
        ]);

        // livro lãpis
        this.add.image(R1 + cx + 10, 600, 'livro-lapis').setOrigin(0.5).setScale(0.7);

        // ── Sala 2 — Estante ─────────────────────────────────
        const vaso = this.add.image(0, 0, 'vaso').setOrigin(0.5).setScale(0.7);

        this.plantaVaso = this.add.image(-10, -13, 'planta-vaso')
            .setOrigin(0.5, 1)
            .setScale(0.7);

        this.vasoGroup = this.add.container(R2 + cx - 80, 180, [vaso, this.plantaVaso])
            .setInteractive(new Phaser.Geom.Rectangle(-60, -130, 120, 200), Phaser.Geom.Rectangle.Contains)
            .on('pointerdown', () => this.onPlantaTap());

        this.estante = this.add.image(0, 0, 'estante').setOrigin(0.5).setScale(0.9);

        this.livro = this.add.image(90, + 120, 'livro')
            .setOrigin(0.5)
            .setScale(0.55)
            .setVisible(false) // revelado após ler o bilhete do casaco @aqui
            .setInteractive(new Phaser.Geom.Rectangle(-25, -25, 100, 270), Phaser.Geom.Rectangle.Contains);
        this.livro.on('pointerdown', () => this.onLivroTap());

        this.estanteGroup = this.add.container(R2 + cx + 5, 515, [
            this.estante,
            this.livro,
        ]);

        // óculos — aparece no quadro da estante ao toque
        const frameX = R2 + cx + 51;
        const frameY = 285;
        const frameW = 90;
        const frameH = 103;

        const maskShape = this.add.graphics();
        maskShape.fillRect(frameX, frameY, frameW, frameH);

        // começa acima do quadro (fora da máscara = invisível)
        this.oculos = this.add.image(frameX + frameW / 2, frameY - 20, 'oculos')
            .setOrigin(0.5)
            .setScale(0.2)
            .setMask(maskShape.createGeometryMask());

        // zona interativa sobre o quadro
        const quadroZone = this.add.zone(frameX, frameY, frameW, frameH).setOrigin(0).setInteractive();
        quadroZone.on('pointerdown', () => this.onQuadroTap());

        if (DEBUG) {
            this.add.rectangle(frameX, frameY, frameW, frameH, 0xff0000, 0.3).setOrigin(0);
            this.input.enableDebug(quadroZone);
        }

        this.flamula = this.add.image(R2 + cx - 3, 400, 'flamula')
            .setOrigin(0.5, 0)
            .setScale(0.9)
            .setInteractive()
            .on('pointerdown', () => this.onFlamulaSwing());
        this.add.circle(R2 + cx - 3, 400, 7, 0x000000);

        if (DEBUG) {
            this.input.enableDebug(this.globo);
            this.input.enableDebug(this.casaco);
            this.input.enableDebug(this.livro);
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
            x: '-=130',
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

        this.sound.play('slide', { volume: 0.4, rate: 1.5 });
        this.folhaCasaco.setVisible(true).setY(-20);
        this.tweens.add({
            targets: this.folhaCasaco,
            y: -40,
            duration: 400,
            ease: 'Power2.Out',
            onComplete: () => {
                this.folhaCasaco
                    .setInteractive()
                    .on('pointerdown', () => this.onBilheteTap());
                this.folhaCasacoGlow = this.addPersistentGlow(this.folhaCasaco);
                if (DEBUG) this.input.enableDebug(this.folhaCasaco);
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
        this.unlockLivro();
    }

    onQuadroTap() {
        if (this.ocolosDesceu) return;
        this.ocolosDesceu = true;
        this.sound.play('som-oculos');

        const frameY = 268;
        const frameH = 103;
        this.tweens.add({
            targets: this.oculos,
            y: frameY + frameH / 2 + 10,
            duration: 1000,
            ease: 'Power2.Out',
        });
    }

    onPlantaTap() {
        if (this.plantaShaking) return;
        this.plantaShaking = true;
        this.sound.play('som-planta-vaso');
        this.tweens.add({
            targets: this.plantaVaso,
            x: '+=5',
            duration: 120,
            ease: 'Linear',
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.plantaVaso.setX(-10);
                this.plantaShaking = false;
            },
        });
    }

    onFlamulaSwing() {
        if (this.flamulaSwinging) return;
        this.flamulaSwinging = true;
        this.sound.play('som-flamula');
        this.tweens.add({
            targets: this.flamula,
            angle: 10,
            duration: 750,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                this.flamula.setAngle(0);
                this.flamulaSwinging = false;
            },
        });
    }

    onLivroTap() {
        this.showBookPopup('"Mover-se com quem pensa diferente\npara impedir a barbárie."');
    }

    onMacanetaErradaTap() {
        this.tweens.add({
            targets: this.portaGroup,
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

        const doorX = this.portaGroup.x + this.porta.x;
        const doorY = this.portaGroup.y + this.porta.y;
        // remove bounds para que o pan possa centralizar na porta sem ser bloqueado pela borda
        this.cameras.main.removeBounds();
        this.cameras.main.pan(doorX, doorY, 900, 'Power2', false, (_cam, progress) => {
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

    unlockLivro() {
        if (this.state.step > 1) return;
        this.state.step = 2;
        this.livro.setVisible(true).setAlpha(0);
        this.tweens.add({ targets: this.livro, alpha: 1, duration: 600 });
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
            .setScrollFactor(0).setVisible(false).setDepth(21).setScale(0.85);

        this.endBtn = this.add.text(cx, cy + 160, 'Conheça o legado revolucionário de Rosa Luxemburgo ▶', {
            fontSize: '27px',
            fontFamily: '"Shadows Into Light", cursive',
            color: '#e5e7db',
            backgroundColor: '#e03420',
            padding: { x: 24, y: 12 },
            wordWrap: { width: 320 },
            align: 'center',
            // lineSpacing: 8
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

        // papel atrás com o texto
        this.bookPopupBg = this.add.image(cx, cy - 100, 'papel-popup')
            .setDisplaySize(width - 50, 420)
            .setScrollFactor(0).setVisible(false).setDepth(11);

        this.bookPopupQuote = this.add.text(cx, cy - 155, '', {
            fontSize: '27px',
            fontFamily: '"Shadows Into Light", cursive',
            fontStyle: 'italic',
            color: '#2c1810',
            align: 'center',
            wordWrap: { width: width - 100 },
            lineSpacing: 8,
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);

        this.bookPopupInstruction = this.add.text(cx, cy - 60, '', {
            fontSize: '19px',
            fontFamily: '"Shadows Into Light", cursive',
            color: '#5a4a3a',
            align: 'center',
            wordWrap: { width: width - 100 },
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);

        // livro aberto embaixo
        this.bookPopupLivro = this.add.image(cx, cy + 100, 'livro-aberto')
            .setDisplaySize(width - 40, 220)
            .setScrollFactor(0).setVisible(false).setDepth(12).setScale(0.9);

        // risquinhos girando — Graphics num container para rotacionar
        const raysY = cy;
        this.bookPopupRaysContainer = this.add.container(cx, raysY)
            .setScrollFactor(0).setVisible(false).setDepth(12);

        const raysGfx = this.add.graphics();
        raysGfx.lineStyle(2.5, 0x222222, 1);
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const inner = i % 2 === 0 ? 32 : 38;
            const outer = i % 2 === 0 ? 56 : 50;
            raysGfx.lineBetween(
                Math.cos(angle) * inner, Math.sin(angle) * inner,
                Math.cos(angle) * outer, Math.sin(angle) * outer
            );
        }
        this.bookPopupRaysContainer.add(raysGfx);
        this.bookPopupRaysTween = null;

        // chave em cima dos risquinhos
        this.bookPopupChave = this.add.image(cx, raysY + 40, 'chave')
            .setOrigin(0.5).setScale(0.9)
            .setScrollFactor(0).setVisible(false).setDepth(13)
            .setInteractive()
            .on('pointerdown', () => this.onPopupChaveTap());

        // fechar — canto superior direito do papel
        this.bookPopupClose = this.add.text(width - 40, cy - 255, '✕', {
            fontSize: '25px',
            fontFamily: '"Shadows Into Light", cursive',
            color: '#5a4a3a',
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(13);
        this.bookPopupClose.setInteractive(
            new Phaser.Geom.Rectangle(-25, -25, 70, 70),
            Phaser.Geom.Rectangle.Contains
        ).on('pointerdown', () => this.hideBookPopup());

        if (DEBUG) this.input.enableDebug(this.bookPopupClose);
    }

    showBookPopup(quote) {
        this.sound.play('paper');
        this.bookPopupQuote.setText(quote).setVisible(true);
        this.bookPopupInstruction.setVisible(false);
        this.popupOverlay.setVisible(true);
        this.bookPopupBg.setVisible(true);
        this.bookPopupLivro.setVisible(true);
        this.bookPopupClose.setVisible(true);

        if (!this.state.chaveObtida) {
            this.bookPopupRaysContainer.setVisible(true);
            this.bookPopupChave.setVisible(true).setAlpha(0);
            this.tweens.add({ targets: this.bookPopupChave, alpha: 1, duration: 300 });
            if (!this.bookPopupChaveGlow) {
                this.bookPopupChaveGlow = this.addPersistentGlow(this.bookPopupChave);
            }
            if (!this.bookPopupRaysTween) {
                this.bookPopupRaysTween = this.tweens.add({
                    targets: this.bookPopupRaysContainer,
                    angle: 360,
                    duration: 3000,
                    repeat: -1,
                    ease: 'Linear',
                });
            }
        }
    }

    hideBookPopup() {
        [
            this.popupOverlay, this.bookPopupBg, this.bookPopupLivro,
            this.bookPopupRaysContainer, this.bookPopupQuote,
            this.bookPopupInstruction, this.bookPopupChave, this.bookPopupClose,
        ].forEach(o => o.setVisible(false));

        if (this.bookPopupChaveGlow) {
            this.bookPopupChave.postFX.remove(this.bookPopupChaveGlow);
            this.bookPopupChaveGlow = null;
        }
        if (this.bookPopupRaysTween) {
            this.bookPopupRaysTween.stop();
            this.bookPopupRaysTween = null;
            this.bookPopupRaysContainer.setAngle(0);
        }
    }

    // ─── Popup ────────────────────────────────────────────────

    createPopupLayer() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        this.popupOverlay = this.add.rectangle(cx, cy, width, height, 0x000000, 0.75)
            .setScrollFactor(0).setVisible(false).setDepth(10);

        this.popupBox = this.add.image(cx, cy, 'papel-popup')
            .setDisplaySize(width - 60, 340)
            .setScrollFactor(0).setVisible(false).setDepth(11);

        this.popupQuote = this.add.text(cx, cy - 70, '', {
            fontSize: '27px',
            fontFamily: '"Shadows Into Light", cursive',
            fontStyle: 'italic',
            color: '#2c1810',
            align: 'center',
            wordWrap: { width: width - 100 },
            // lineSpacing: 10,
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);

        this.popupInstruction = this.add.text(cx, cy + 60, '', {
            fontSize: '24px',
            fontFamily: '"Shadows Into Light", cursive',
            color: '#e8442f',
            align: 'center',
            wordWrap: { width: width - 120 },
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);

        // chave dentro do popup — aparece só no popup dos livro
        this.popupChave = this.add.image(cx, cy + 130, 'chave')
            .setOrigin(0.5)
            .setScale(0.45)
            .setScrollFactor(0).setVisible(false).setDepth(13)
            .setInteractive()
            .on('pointerdown', () => this.onPopupChaveTap());

        this.popupClose = this.add.text(width - 60, cy - 140, '✕', {
            fontSize: '27px',
            fontFamily: '"Shadows Into Light", cursive',
            color: '#2c1810',
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(12);
        this.popupClose.setInteractive(
            new Phaser.Geom.Rectangle(-15, -15, 65, 65),
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
        if (this.bookPopupRaysTween) {
            this.bookPopupRaysTween.stop();
            this.bookPopupRaysTween = null;
        }
        this.bookPopupRaysContainer.setVisible(false);

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
