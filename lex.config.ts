import { defineLexiconConfig } from '@atcute/lex-cli';

export default defineLexiconConfig({
  generate: {
    files: ['lexgen/**/*.ts'],
    outdir: 'src/lib/at/lexicons',
  },
  export: {
    outdir: 'lexicons/',
    clean: true,
  },
});
