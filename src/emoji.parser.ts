import Delta from 'quill-delta';
import Quill, { RangeStatic } from 'quill';
import { EmojiMap } from './emoji.map';

declare global {
  interface Window {
    Quill?: typeof Quill;
  }
}

export type EmojiParserOptions = {
  removeShortcut?: RegExp | Array<string> | string;
  removeEmoji?: RegExp | Array<string> | string;
  parseOnBlur?: boolean;
  onBeforePaste?: (node?: string, delta?: Delta) => void;
  onPasted?: (node?: string, delta?: Delta) => void;
  onBeforeTextChange?: (delta?: Delta) => void;
  onTextChanged?: (delta?: Delta) => void;
  onBeforeUpdate?: (shortcut?: string, emoji?: string) => boolean;
  onUpdated?: (
    shortcut?: string,
    emoji?: string,
    delta?: Delta,
    selection?: RangeStatic | null
  ) => void;
};

export type EmojiParserType = 'text-change' | 'paste';

export default class EmojiParser {
  public quill: Quill;
  private _map: Record<string, string>;

  private _parseOnBlur = false;

  private _onBeforePaste = (node: string, delta?: Delta) => {};
  private _onPasted = (node: string, delta?: Delta) => {};
  private _onBeforeTextChange = (delta?: Delta) => {};
  private _onTextChanged = (delta?: Delta) => {};
  private _onBeforeUpdate = (shortcut?: string, emoji?: string) => true;
  private _onUpdated = (
    shortcut?: string,
    emoji?: string,
    delta?: Delta,
    selection?: RangeStatic | null
  ) => {};

  constructor(quill: Quill, options?: EmojiParserOptions) {
    this.quill = quill;

    this._map = { ...EmojiMap };

    this._removeShortcut(options?.removeShortcut);
    this._removeEmoji(options?.removeEmoji);

    if (options?.onBeforePaste)
      this._onBeforePaste = options.onBeforePaste.bind(this);
    if (options?.onPasted) this._onPasted = options.onPasted.bind(this);
    if (options?.onBeforeTextChange)
      this._onBeforeTextChange = options.onBeforeTextChange.bind(this);
    if (options?.onTextChanged)
      this._onTextChanged = options.onTextChanged.bind(this);
    if (options?.onBeforeUpdate)
      this._onBeforeUpdate = options.onBeforeUpdate.bind(this);
    if (options?.onUpdated) this._onUpdated = options.onUpdated.bind(this);

    this._parseOnBlur = options?.parseOnBlur || false;

    this.registerTypeListener();
    this.registerPasteListener();
    this.registerBlurListener();
  }

  public registerPasteListener() {
    this.quill.clipboard.addMatcher(Node.TEXT_NODE, (node: any, delta: any) => {
      if (typeof node.data !== 'string') {
        return;
      }

      this._onBeforePaste(node, delta);

      const op = delta.ops[0];
      if (!op.insert) return delta;

      // Split the string to prepare for emoji checks.
      const words = op.insert && op.insert.split(' ');

      if (words) {
        for (const word of words) {
          if (word in EmojiMap) {
            const emoji = EmojiMap[word];
            op.insert = op.insert.replace(word, emoji);
          }
        }
      }

      this._onPasted(node, delta);

      return delta;
    });
  }

  public registerTypeListener() {
    this.quill.on('text-change', (delta) => {
      const ops = delta.ops;

      // Only return true, if last operation includes whitespace inserts.
      // Equivalent to listening for enter, tab or space.
      if (!ops || ops.length < 1 || ops.length > 2) {
        return;
      }

      this._onBeforeTextChange(delta);

      const lastOp = ops[ops.length - 1];
      if (
        !lastOp.insert ||
        typeof lastOp.insert !== 'string' ||
        !lastOp.insert.match(/\s/)
      ) {
        return;
      }

      this._checkTextForEmoji();

      this._onTextChanged(delta);
    });
  }

  public registerBlurListener() {
    if (this._parseOnBlur) {
      this.quill.root.addEventListener('blur', () => {
        // One last check.
        this._checkTextForEmoji();
      });
    }
  }

  private _checkTextForEmoji() {
    const sel = this.quill.getSelection();
    if (!sel) {
      return;
    }

    // Get the leaf and its index.
    const [leaf] = this.quill.getLeaf(sel.index);
    const leafIndex = this.quill.getIndex(leaf);

    if (!leaf.text) {
      return;
    }

    // We only care about the leaf until the current cursor position.
    const relevantLength = sel.index - leafIndex;
    const text: string = leaf.text.slice(0, relevantLength);

    if (!text) {
      return;
    }

    // Split the leaf to check for emojis.
    const words = text && text.split(' ');

    if (words) {
      for (const word of words) {
        if (word in EmojiMap) {
          const emoji = EmojiMap[word];

          if (this._onBeforeUpdate(word, emoji)) {
            const ops = new Delta()
              // Retain text until the position of the word.
              .retain(leafIndex + text.indexOf(word))
              // Delete the word.
              .delete(word.length)
              // Insert the emoji.
              .insert(emoji);

            // Update content now.
            this.quill.updateContents(ops);

            // Update selection when possible.
            queueMicrotask(() => {
              this.quill.setSelection(
                // Set selection to the index of the original word + the emoji + space.
                leafIndex + text.indexOf(word) + emoji.length + 1,
                0,
                'silent'
              );
              this._onUpdated(word, emoji, ops, this.quill.getSelection());
            });
          }
        }
      }
    }
  }

  private _removeShortcut(
    shortcuts?: RegExp | Array<string> | string
  ): Record<string, string> | undefined {
    if (!shortcuts) return;

    if (shortcuts instanceof RegExp) {
      return Object.fromEntries(
        Object.entries(this._map).filter(([key]) => !shortcuts.test(key))
      );
    }

    if (Array.isArray(shortcuts)) {
      return Object.fromEntries(
        Object.entries(this._map).filter(([key]) => !shortcuts.includes(key))
      );
    }

    if (typeof shortcuts === 'string') {
      const arr = shortcuts.split(' ');
      return Object.fromEntries(
        Object.entries(this._map).filter(([key]) => !arr.includes(key))
      );
    }
  }

  private _removeEmoji(
    emojis?: RegExp | Array<string> | string
  ): Record<string, string> | undefined {
    if (!emojis) return;

    if (emojis instanceof RegExp) {
      return Object.fromEntries(
        Object.entries(this._map).filter(([value]) => !emojis.test(value))
      );
    }

    if (Array.isArray(emojis)) {
      return Object.fromEntries(
        Object.entries(this._map).filter(([value]) => !emojis.includes(value))
      );
    }

    if (typeof emojis === 'string') {
      const arr = emojis.split(' ');
      return Object.fromEntries(
        Object.entries(this._map).filter(([value]) => !arr.includes(value))
      );
    }
  }
}

if (window != null && window.Quill) {
  window.Quill.register('modules/emojiParser', EmojiParser);
}

export { EmojiMap as emojiMap };
