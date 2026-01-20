import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app', // Detta är magin. Vite kommer tro att "app"-mappen är roten.
  build: {
    outDir: '../dist', // Vi vill fortfarande att bygget ska hamna utanför 'app'
    emptyOutDir: true,
  },
  publicDir: 'public' // Vite letar nu efter public inuti 'app/public' automatiskt
});