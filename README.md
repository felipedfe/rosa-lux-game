# Jogo Rosa Lux

Jogo mobile em Phaser 3 com Vite, orientação portrait.

## Requisitos

- [Node.js](https://nodejs.org/) v16+ (recomendado v18+)
- npm (já vem com o Node)

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:5173`.

Para testar no celular físico na mesma rede Wi-Fi, acesse o IP local exibido no terminal (ex: `http://192.168.x.x:5173`).

## Build para produção

```bash
npm run build
```

Gera a pasta `dist/` pronta para deploy.

## Estrutura do projeto

```
jogo-rosa-lux/
├── public/
│   └── assets/          # imagens, áudios, spritesheets
├── src/
│   ├── main.js          # config do Phaser + lista de cenas
│   └── scenes/
│       ├── Boot.js      # cena inicial (carrega assets de loading)
│       ├── Preload.js   # carrega todos os assets do jogo
│       ├── MainMenu.js  # tela de menu
│       └── Game.js      # cena principal do jogo
├── index.html
├── vite.config.js
└── package.json
```

## Resolução base

O jogo usa `390 × 844` px (proporção iPhone 14) com `Phaser.Scale.FIT` — se adapta automaticamente a qualquer tamanho de tela mantendo a proporção.

## Adicionando assets

Coloque arquivos em `public/assets/` e carregue na cena `Preload`:

```js
// imagem
this.load.image('player', 'assets/player.png');

// spritesheet
this.load.spritesheet('run', 'assets/run.png', { frameWidth: 64, frameHeight: 64 });

// áudio
this.load.audio('bgm', 'assets/bgm.mp3');
```

## Adicionando cenas

1. Crie `src/scenes/NovaCena.js` exportando uma classe que estende `Phaser.Scene`
2. Importe e adicione ao array `scene` em `src/main.js`
3. Navegue com `this.scene.start('NovaCena')`
