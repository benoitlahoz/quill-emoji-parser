import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EmojiParser',
      fileName: (format: any) => {
        const name = 'quill-emoji-parser';

        if (format === 'umd') {
          return `${name}.min.js` as string;
        }

        return `${name}.mjs` as string;
      },
      formats: ['es', 'umd'],
    },
    target: 'esnext',
    minify: 'terser',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['quill-delta'],
      output: {
        inlineDynamicImports: true,
        exports: 'named',
        globals: { 'quill-delta': 'QuillDelta' },
      },
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
