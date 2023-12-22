import Quill, { RangeStatic } from 'quill';
import { EmojiMap } from './emoji.map';

const Delta = Quill.import('delta');

declare global {
  interface Window {
    Quill?: typeof Quill;
  }
}

export interface EmojiParserOptions {
  // A custom map to use.
  map?: Record<string, string>;
  // Shortcuts to be bypassed.
  bypassShortcuts?: RegExp | Array<string> | string;
  // Emojis to be bypassed.
  bypassEmojis?: RegExp | Array<string> | string;
  // The `onblur` behavior.
  parseOnBlur?: boolean;

  // Fired when plugin is instantiated. Gives access to some of its methods.
  onInstance?: (instance: EmojiParserInstance) => void;
  // Fired before parsing the clipboard content.
  onBeforePaste?: (node?: string, delta?: typeof Delta) => void;
  // Fired after parsing the clipboard content.
  onPasted?: (node?: string, delta?: typeof Delta) => void;
  // Fired before parsing typed text.
  onBeforeTextChange?: (delta?: typeof Delta) => void;
  // Fired after parsing typed text.
  onTextChanged?: (delta?: typeof Delta) => void;
  // Fired before each parsed shortcut.
  onBeforeUpdate?: (shortcut?: string, emoji?: string) => boolean | undefined;
  // Fired after a shortcut has been parsed.
  onUpdated?: (
    shortcut?: string,
    emoji?: string,
    delta?: typeof Delta,
    selection?: RangeStatic | null
  ) => void;
}

export interface EmojiParserInstance {
  // Refresh the whole content by performing a kind of copy/paste action.
  refresh: () => void;
  // Dynamically add or remove shortcuts to be bypassed.
  bypassShortcuts: (
    shortcuts?: RegExp | Array<string> | string
  ) => Record<string, string> | undefined;
  // Dynamically add or remove emojis to be bypassed.
  bypassEmojis: (
    shortcuts?: RegExp | Array<string> | string
  ) => Record<string, string> | undefined;
  // Dynamically change the `onblur` behavior.
  parseOnBlur: (value: boolean) => void;
}

export default class EmojiParser {
  private _quill: Quill;
  private _baseMap = { ...EmojiMap };
  private _currentMap: Record<string, string>;
  private _emojisBlacklist: Array<string> = [];

  private _parseOnBlur = false;

  private _onBeforePaste = (node: string, delta?: typeof Delta) => {};
  private _onPasted = (node: string, delta?: typeof Delta) => {};
  private _onBeforeTextChange = (delta?: typeof Delta) => {};
  private _onTextChanged = (delta?: typeof Delta) => {};
  private _onBeforeUpdate: (
    shortcut?: string,
    emoji?: string
  ) => boolean | undefined = (shortcut?: string, emoji?: string) => true;
  private _onUpdated = (
    shortcut?: string,
    emoji?: string,
    delta?: typeof Delta,
    selection?: RangeStatic | null
  ) => {};

  constructor(quill: Quill, options?: EmojiParserOptions) {
    this._quill = quill;

    this._baseMap = options?.map ? { ...options.map } : { ...this._baseMap };
    this._currentMap = this._baseMap;

    this._bypassShortcuts(options?.bypassShortcuts);
    this._bypassEmojis(options?.bypassEmojis);

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

    if (options?.onInstance) {
      options.onInstance({
        refresh: this._refresh.bind(this),
        bypassShortcuts: this._bypassShortcuts.bind(this),
        bypassEmojis: this._bypassEmojis.bind(this),
        parseOnBlur: (value: boolean) => {
          this._parseOnBlur = value;
        },
      });
    }
  }

  public registerPasteListener() {
    this._quill.clipboard.addMatcher(
      Node.TEXT_NODE,
      (node: any, delta: typeof Delta) => {
        if (typeof node.data !== 'string') {
          return;
        }

        this._onBeforePaste(node, delta);

        const op = delta.ops[0];
        if (!op.insert) return delta;

        // Replace blacklisted emojis.
        for (const blackEmoji of this._emojisBlacklist) {
          op.insert = op.insert.replaceAll(blackEmoji, '');
        }

        // Split the string to prepare for emoji checks.
        const words = op.insert && op.insert.split(' ');

        if (words) {
          for (const word of words) {
            if (word in this._currentMap) {
              const emoji = this._currentMap[word];
              if (this._onBeforeUpdate(word, emoji) !== false) {
                op.insert = op.insert.replace(word, emoji);
                this._onUpdated(word, emoji, op, this._quill.getSelection());
              }
            }
          }
        }

        this._onPasted(node, delta);

        return delta;
      }
    );
  }

  public registerTypeListener() {
    this._quill.on('text-change', (delta) => {
      const ops = delta.ops;

      // Only return true, if last operation includes whitespace inserts.
      // Equivalent to listening for enter, tab or space.
      if (!ops || ops.length < 1 || ops.length > 2) {
        return;
      }

      const lastOp = ops[ops.length - 1];
      if (
        !lastOp.insert ||
        typeof lastOp.insert !== 'string' ||
        !lastOp.insert.match(/\s/)
      ) {
        return;
      }

      this._onBeforeTextChange(delta);

      this._checkTextForEmoji();

      this._onTextChanged(delta);
    });
  }

  public registerBlurListener() {
    if (this._parseOnBlur) {
      this._quill.root.addEventListener('blur', () => {
        // One last check.
        this._checkTextForEmoji();
      });
    }
  }

  private _checkTextForEmoji() {
    const sel = this._quill.getSelection();
    if (!sel) {
      return;
    }

    // Get the leaf and its index.
    const [leaf] = this._quill.getLeaf(sel.index);
    const leafIndex = this._quill.getIndex(leaf);

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
        if (word in this._currentMap) {
          const emoji = this._currentMap[word];

          if (this._onBeforeUpdate(word, emoji) !== false) {
            const ops = new Delta()
              // Retain text until the position of the word.
              .retain(leafIndex + text.indexOf(word))
              // Delete the word.
              .delete(word.length)
              // Insert the emoji.
              .insert(emoji);

            // Update content now.
            this._quill.updateContents(ops);

            // Update selection when possible.
            queueMicrotask(() => {
              this._quill.setSelection(
                // Set selection to the index of the original word + the emoji + space.
                leafIndex + text.indexOf(word) + emoji.length + 1,
                0,
                'silent'
              );

              this._onUpdated(word, emoji, ops, this._quill.getSelection());
            });
          }
        }
      }
    }
  }

  /**
   * Parse all by copying / pasting.
   */
  private async _refresh() {
    const hasFocus = this._quill.hasFocus();

    const selection = this._quill.getSelection(true);
    const content = this._quill.root.innerHTML;

    this._quill.setContents([{ insert: '\n' }] as typeof Delta);
    this._quill.setSelection(0, this._quill.scroll.length());
    this._quill.clipboard.dangerouslyPasteHTML(content);

    queueMicrotask(() => {
      if (selection)
        this._quill.setSelection(selection.index, selection.length);
      if (!hasFocus) this._quill.blur();
    });
  }

  private _bypassShortcuts(
    shortcuts?: RegExp | Array<string> | string
  ): Record<string, string> | undefined {
    if (!shortcuts) {
      this._currentMap = { ...this._baseMap };
      return;
    }

    if (shortcuts instanceof RegExp) {
      this._currentMap = Object.fromEntries(
        Object.entries(this._baseMap).filter(([key]) => !shortcuts.test(key))
      );
      return;
    }

    if (Array.isArray(shortcuts)) {
      this._currentMap = Object.fromEntries(
        Object.entries(this._baseMap).filter(
          ([key]) => !shortcuts.includes(key)
        )
      );

      return;
    }

    if (typeof shortcuts === 'string') {
      const potentialRegExp = this._stringToRegex(shortcuts.trim());
      console.log(potentialRegExp);
      if (potentialRegExp) {
        this._currentMap = Object.fromEntries(
          Object.entries({ ...this._baseMap }).filter(
            ([key]) => !potentialRegExp.test(key)
          )
        );
        return;
      }

      const arr = shortcuts.split(' ');
      this._currentMap = Object.fromEntries(
        Object.entries(this._baseMap).filter(([key]) => !arr.includes(key))
      );
      return;
    }
  }

  private _bypassEmojis(
    emojis?: RegExp | Array<string> | string
  ): Record<string, string> | undefined {
    // Reset paste blacklist.
    this._emojisBlacklist.length = 0;

    if (!emojis) {
      this._currentMap = { ...this._baseMap };
      return;
    }

    if (emojis instanceof RegExp) {
      this._currentMap = Object.fromEntries(
        Object.entries(this._baseMap).filter(
          ([_, value]) => !emojis.test(value)
        )
      );

      this._blacklistEmojis();

      return;
    }

    if (Array.isArray(emojis)) {
      this._currentMap = Object.fromEntries(
        Object.entries(this._baseMap).filter(
          ([_, value]) => !emojis.includes(value)
        )
      );

      this._blacklistEmojis();

      return;
    }

    if (typeof emojis === 'string') {
      let regex = false;

      const potentialRegExp = this._stringToRegex(emojis.trim());
      if (potentialRegExp) {
        this._currentMap = Object.fromEntries(
          Object.entries(this._baseMap).filter(
            ([_, value]) => !potentialRegExp.test(value)
          )
        );
        regex = true;
      }

      if (!regex) {
        const arr = emojis.split(' ');
        this._currentMap = Object.fromEntries(
          Object.entries(this._baseMap).filter(
            ([_, value]) => !arr.includes(value)
          )
        );
      }

      this._blacklistEmojis();

      return;
    }
  }

  private _blacklistEmojis() {
    this._emojisBlacklist = Array.from(
      new Set(
        Object.values(this._baseMap).filter(
          (value: string) => !Object.values(this._currentMap).includes(value)
        )
      )
    );
  }

  // https://stackoverflow.com/a/75291120/1060921
  private _stringToRegex(str: string) {
    // const re = /\/(.+)\/([gim]?)/;
    const re = /^\/((?:\\.|[^\\])*)\/(.*)$/;
    const match = str.match(re);
    if (match) {
      return new RegExp(match[1], match[2]);
    }
  }
}

if (window != null && window.Quill) {
  window.Quill.register('modules/emojiParser', EmojiParser);
}

export { EmojiMap };
