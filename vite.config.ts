import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        // Exponer variables VITE_ al cliente
        'import.meta.env.VITE_DATA_MODE': JSON.stringify(env.VITE_DATA_MODE),
        'import.meta.env.VITE_SYMBOL': JSON.stringify(env.VITE_SYMBOL),
        'import.meta.env.VITE_TIMEFRAME': JSON.stringify(env.VITE_TIMEFRAME),
        'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL),
        // Variables de entorno para APIs
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
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
