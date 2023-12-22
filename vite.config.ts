import { resolve, join } from 'path';
import { readFileSync, copyFileSync } from 'fs';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/emoji.parser.ts'),
      name: 'EmojiParser',
      fileName: (format: any) => {
        const name = 'quill-emoji-parser';

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
    emptyOutDir: true,
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
    // Explicitly emit an index.html file for demo purposes
    {
      name: 'copy-bundle',
      writeBundle() {
        copyFileSync(
          resolve(__dirname, 'dist', 'quill-emoji-parser.min.js'),
          join(__dirname, 'docs', 'quill-emoji-parser.min.js')
        );
        /*
        this.emitFile({
          type: 'asset',
          fileName: 'index.html',
          source: readFileSync(
            resolve(__dirname, 'demo', 'index.html'),
            'utf-8'
          ),
        });
        */
      },
    },
  ],
});
