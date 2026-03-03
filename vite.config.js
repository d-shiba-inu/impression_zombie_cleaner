// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // ここを更新！

export default defineConfig({
  plugins: [react()], // Reactプラグインを有効化
  root: 'src', 
  build: {
    // 🌟 ビルドしたファイルを Rails が読み込める public フォルダに出力
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    port: 3001,
  }
});