import { EditorView, Decoration } from '@codemirror/view';

import { StateField, RangeSetBuilder, EditorState, type Extension } from '@codemirror/state';

// Via: https://github.com/uiwjs/react-codemirror/blob/e275fb67ec94a6bfe9f7f795fd4e867baeae770a/extensions/hyper-link/src/index.ts#L13.
// MIT License
// Copyright (c) 2021 uiw
const urlRegex = /\b((?:https?|ftp):\/\/[^\s/$.?#].[^\s]*\b(?:\/)?)/gi;

function buildDecorations(state: EditorState) {
  const builder = new RangeSetBuilder();
  const text = state.doc.toString();

  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const from = match.index;
    const to = from + url.length;

    const mark = Decoration.mark({
      class: 'cm-hyperlink',
      attributes: {
        'data-url': url
      }
    });

    builder.add(from, to, mark);
  }

  return builder.finish();
}

const urlField = StateField.define({
  create(state) {
    return buildDecorations(state);
  },

  update(decorations, tr) {
    if (tr.docChanged) {
      return buildDecorations(tr.state);
    }

    return decorations;
  },

  provide: (f) => EditorView.decorations.from(f)
});

const theme = EditorView.baseTheme({
  '.cm-hyperlink': {
    color: '#1a73e8',
    textDecoration: 'underline',
    cursor: 'text'
  },
  '&.meta-pressed .cm-hyperlink:hover': { cursor: 'pointer' }
});

const clickHandler = EditorView.domEventHandlers({
  keydown(event, view) {
    if (event.metaKey || event.ctrlKey) {
      view.dom.classList.add('meta-pressed');
    }
  },
  keyup(event, view) {
    if (!(event.metaKey || event.ctrlKey)) {
      view.dom.classList.remove('meta-pressed');
    }
  },
  click(event, view) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return false;

    const el = target.closest('.cm-hyperlink');

    if (!el) return false;

    const url = el.getAttribute('data-url');

    if (!url || !(event.metaKey || event.ctrlKey)) return false;

    window.open(url, '_blank', 'noopener');

    return true;
  }
});

export const hyperlink: Extension = [urlField, theme, clickHandler];
