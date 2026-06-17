import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
    base: mode === 'locaweb' ? '/rosa-lux/' : './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    },
    server: {
        host: true, // expose para acesso via celular na mesma rede
        port: 5174
    }
}));
