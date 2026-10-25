import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Ignore transient disconnect / abort errors during client reload
            if (err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') return;
            console.warn('[Vite Socket Proxy Warning]:', err.message);
          });
        },
      },
    },
  },
});
