import { resolve, join } from 'path';
import { readFileSync, copyFileSync } from 'fs';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/maps/emoji.map.ts'),
      name: 'EmojiMap',
      fileName: (format: any) => {
        const name = 'quill-emoji-parser.default-map';

        if (format === 'umd') {
          return `${name}.min.js` as string;
        }

        return `${name}.mjs` as string;
      },
      formats: ['umd', 'es'],
    },
    target: 'esnext',
    minify: 'terser',
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      external: ['quill'],
      output: {
        inlineDynamicImports: true,
        exports: 'named',
        globals: {
          quill: 'Quill',
        },
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
    {
      name: 'copy-bundle',
      writeBundle() {
        copyFileSync(
          resolve(__dirname, 'dist', 'quill-emoji-parser.default-map.min.js'),
          join(__dirname, 'docs', 'quill-emoji-parser.default-map.min.js')
        );
      },
    },
  ],
});
