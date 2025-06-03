import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/fetch-page': 'http://localhost:3000', // Adjust the server URL if needed
    },
  },
});
