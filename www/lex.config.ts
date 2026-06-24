import { defineLexiconConfig } from '@atcute/lex-cli';

export default defineLexiconConfig({
  generate: {
    files: ['src/lib/at/lexicons/**/*.ts'],
    outdir: 'src/lib/at/generated',
  },
  export: {
    outdir: 'lexicons/',
    clean: true,
  },
});
