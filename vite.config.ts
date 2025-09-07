import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          // Fix: __dirname is not available in ESM modules. Using `import.meta.url` for path resolution.
          '@': fileURLToPath(new URL('.', import.meta.url)),
        }
      },
      server: {
        proxy: {
          '/api/klines': {
            target: 'https://api.binance.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api/, '/api/v3')
          }
        }
      },
      build: {
        // subir el umbral del warning (opcional)
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-recharts': ['recharts'],
            },
          },
        },
      },
    };
});
