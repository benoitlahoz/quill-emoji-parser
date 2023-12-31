import { resolve, join } from 'path';
import { copyFileSync } from 'fs';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/map-included/index.ts'),
      name: 'EmojiParser',
      fileName: (format: any) => {
        const name = 'quill-emoji-parser.map-incl';

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
          resolve(__dirname, 'dist', 'quill-emoji-parser.map-incl.min.js'),
          join(__dirname, 'docs', 'quill-emoji-parser.map-incl.min.js')
        );
      },
    },
  ],
});
