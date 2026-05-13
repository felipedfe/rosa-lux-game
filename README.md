# Rosa Lux — Mini Escape Room

A mobile-first interactive mini escape room built for the **Rosa Luxemburg Foundation** (Fundação Rosa Luxemburgo - https://rosalux.org.br/). The game works as a narrative experience disguised as a puzzle. Players explore three connected rooms, interact with objects, and uncover quotes and clues tied to Rosa Luxemburg's legacy.

<!-- screenshot or cover image here -->

## Tech stack

- [Phaser 3](https://phaser.io/) — game framework
- [Vite 5](https://vitejs.dev/) — dev server and bundler
- Vanilla JavaScript

## Getting started

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build

```bash
npm run build
```

Outputs to `dist/`, ready for static hosting.

## Project structure

```
rosa-lux/
├── public/assets/       # images and other static assets
├── src/
│   ├── main.js          # Phaser config and scene list
│   └── scenes/
│       ├── Preload.js   # loads all assets
│       ├── MainMenu.js  # intro screen with character and speech bubble
│       └── Game.js      # escape room — rooms, interactions, popups
├── index.html
├── vite.config.js
└── package.json
```
