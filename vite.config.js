// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // ここを更新！

export default defineConfig({
  plugins: [react()], // Reactプラグインを有効化
  root: 'src', 
  server: {
    port: 3001,
  }
});