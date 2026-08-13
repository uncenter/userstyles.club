import { defineLexiconConfig } from '@atcute/lex-cli';

export default defineLexiconConfig({
  generate: {
    files: ['lexgen/**/*.ts'],
    outdir: 'src/',
    imports: ['@atcute/atproto'],
    clean: true,
  },
  export: {
    outdir: '../../lexicons/',
    clean: true,
  },
});
