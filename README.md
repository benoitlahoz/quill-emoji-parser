# quill-emoji-parser

---

[![npm version](https://badge.fury.io/js/quill-emoji-parser.svg)](https://badge.fury.io/js/quill-emoji-parser)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fbenoitlahoz%2Fquill-emoji-parser.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fbenoitlahoz%2Fquill-emoji-parser?ref=badge_shield&issueType=license)

Checks for emojis shortcuts during typing and pasting and replace them by their visual counterpart.

Very much inspired by [quill-magic-url](https://github.com/visualjerk/quill-magic-url/) and the answer to [this Stack Overflow question](https://stackoverflow.com/questions/77667011/in-quill-how-to-parse-deltas-and-replace-some-of-its-content). Default map is taken from [Smile2Emoji](https://github.com/emish89/smile2emoji) 🙏.

## Demo

A demo is available here: [Quill Emoji Parser](https://benoitlahoz.github.io/quill-emoji-parser/)

## Install

### From CDN

```
<!-- For full module with map included, after quill script includes -->
<script src="https://unpkg.com/quill-emoji-parser@0.9.0/dist/quill-emoji-parser.map-incl.min.js"></script>

<!-- For base module without map included, after quill script includes -->
<script src="https://unpkg.com/quill-emoji-parser@0.9.0/dist/quill-emoji-parser.min.js"></script>

<!-- Import default emojis map, named EmojiMap -->
<script src="https://unpkg.com/quill-emoji-parser@0.9.0/dist/quill-emoji-parser.default-map.min.js"></script>
```

### With NPM or Yarn

```
npm install quill-emoji-parser

yarn add quill-emoji-parser
```

**With default emojis map included**

```typescript
import Quill from 'quill';
import EmojiParser from 'quill-emoji-parser';

Quill.register('modules/emojiParser', EmojiParser);
```

**With no emojis map included**

```typescript
import Quill from 'quill';
import EmojiParser from 'quill-emoji-parser/base';
// Optionally import default map.
// import { EmojiMap } from 'quill-emoji-parser/default-map';

Quill.register('modules/emojiParser', EmojiParser);
```

## Usage

**Basic usage with no options and default map:**

```typescript
const quill = new Quill(editor, {
  modules: {
    // When module was imported with map included (default).
    emojiParser: true,

    // When module was imported with
    // import EmojiParser from 'quill-emoji-parser/base;
    // import { EmojiMap } from 'quill-emoji-parser/default-map;
    emojiParser: {
      map: EmojiMap,
    },

    // When module was included with script tags, to use default map.
    emojiParser: {
      map: EmojiMap.default,
    },
  },
});
```

**Usage with custom options:**

```typescript
const quill = new Quill(editor, {
  modules: {
    emojiParser: {
      // Will remove shortcuts between ':'.
      bypassShortcuts: /:[a-z0-9_-]*:/i,
      // Will remove specific emojis.
      bypassEmojis: ['😈', '😜'],

      // For other options, see below...
    },
  },
});
```

## Options

When importing full package with default map, all options are undefined or false by default. If module was imported without map (ie. `... from 'quill-emoji-parser/base'`), you need to explicitly provide a map.

```typescript
export interface EmojiParserOptions {
  // A custom map to use (mandatory when importing 'base' package).
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
```

### map

> Imports a custom shortcut-to-replacement map.
> That means that you can eventually use `quill-emoji-parser` as a... anything parser...
> With some limitations... Use at your own risk!
>
> **To avoid importing the full package when providing a custom map:** > `import EmojiParser from 'quill-emoji-parser/base';`

```typescript
Record<string, string>;
```

**Example**

```typescript
const myMap = {
  smile: '😄', // A sentence like 'I smile everyday!' will be transformed in 'I 😄 everyday!'
};

// ...

modules: {
  emojiParser: {
    map: myMap;
  }
}
```

### bypassShortcuts

> Disallow the transformation of some shortcuts from the emoji map.
> In the example below `:poop:` will not be parsed, but `:hankey:` will.
> Note that the string will be kept, unlike in `bypassEmojis` that will
> delete the pasted emoji from the content.

```typescript
RegExp | Array<string> | string;
```

**Example**

```typescript
// ...

modules: {
    emojiParser: {
        bypassShortcuts: /(:([^:]+):)/gi,
    }

    // or

    emojiParser: {
        // Strings separated by space.
        bypassShortcuts: ':open_mouth: :poop:'
    }

    // or

    emojiParser: {
        // Array of strings.
        bypassShortcuts: [':open_mouth:', ':poop:']
    }
}
```

### bypassEmojis

> Remove some emojis from the emoji map. That means that typed shortcut will not be parsed,
> and that a pasted blacklisted emoji will be deleted.
> For example, typing or pasting `:poop:` or `:hankey:` will not be parsed, but will be kept as text, and
> pasting :poop: will simply be deleted from the content.

```typescript
RegExp | Array<string> | string;
```

**Example**

```typescript
// ...

modules: {
    emojiParser: {
        // Removes some emojis...
        bypassEmojis: /\p{Emoji_Presentation}/gu,
    }

    // or

    emojiParser: {
        // Strings separated by space.
        bypassEmojis: '😮 💩'
    }

    // or

    emojiParser: {
        // Array of strings.
        bypassEmojis: ['😮', '💩']
    }
}
```

### parseOnBlur

> Performs a last check before the editor lose focus.

```typescript
boolean;
```

**Example**

```typescript
// ...

modules: {
  emojiParser: {
    parseOnBlur: true,
  }
}
```

### onInstance

> Function called when the module has been instantiated.
> The returned `EmojiParserInstance` object exposes some methods to dynamically
> change the module behavior.

```typescript
onInstance?: (instance: EmojiParserInstance) => void;

export interface EmojiParserInstance {
  // Refresh the whole content by performing a kind of copy/paste action.
  refresh: () => void;
  // Dynamically add or remove shortcuts to be bypassed.
  // When a bypassed shortcut is removed, note that enterign a space after a shortcut will
  // trigger parse function.
  bypassShortcuts: (
    shortcuts?: RegExp | Array<string> | string
  ) => Record<string, string> | undefined;
  // Dynamically add or remove emojis to be bypassed.
  // Same behavior.
  bypassEmojis: (
    shortcuts?: RegExp | Array<string> | string
  ) => Record<string, string> | undefined;
  // Dynamically change the `onblur` behavior.
  parseOnBlur: (value: boolean) => void;
}
```

**Example**

```typescript

let emojiParser: EmojiParserInstance;

// ...

modules: {
  emojiParser: {
    onInstance(instance: EmojiParserInstance) {
        emojiParser = instance;
    }
  }
}

// ...

button.addEventListener('click', () => {
    emojiParser.refresh();
});

input.addEventListener('change', () => {
    emojiParser.bypassShortcuts(input.value);
});
```

### onBeforePaste

> Function called before parsing pasted text.
> At this time, you still can modify `node` and `delta`.

```typescript
(node?: string, delta?: Delta) => void
```

**Example**

```typescript
// ...

modules: {
    emojiParser: {
        onBeforePaste(node: string, delta: Delta) {
            // The original node
            console.log(node);
            // The original Delta.
            console.log(delta);
        }
    }
}
```

### onPasted

> Function called after parsing pasted text.
> Gives the resulting `node` and `delta` of the transformation.

```typescript
(node?: string, delta?: Delta) => void
```

**Example**

```typescript
// ...

modules: {
    emojiParser: {
        onPasted(node: string, delta: Delta) {
            // The parsed node
            console.log(node);
            // The parsed Delta.
            console.log(delta);
        }
    }
}
```

### onBeforeTextChange

> Function called when a character was typed, before parsing.
> No check was done yet, but we're sure that there is a `Delta` to check,
> and that it contains an `insert` of type `string` that is not only a space.

```typescript
(delta?: Delta) => void;
```

**Example**

```typescript
// ...

modules: {
    emojiParser: {
        onBeforeTextChange(delta: Delta) {
            // The original Delta.
            console.log(delta);
        }
    }
}
```

### onTextChanged

> Function called when a character was typed, after parsing.
> It returns the new `Delta`.

```typescript
(delta?: Delta) => void;
```

**Example**

```typescript
// ...

modules: {
    emojiParser: {
        onTextChanged(delta: Delta) {
            // The parsed Delta.
            console.log(delta);
        }
    }
}
```

### onBeforeUpdate

> Function called for each found emoji.
> It is the place to put conditions to further parsing.
> Returning `false` will bypass the shortcut-to-emoji transformation.

```typescript
(shortcut?: string, emoji?: string) => boolean;
```

**Example**

```typescript
// ...

modules: {
    emojiParser: {
        onBeforeUpdate(shortcut: string, emoji: string) {
            if (shortcut === ':poop') return false;
            if (emoji === '💩') return false;

            return true;
        }
    }
}
```

### onUpdated

> Function called after each emoji is succesfully parsed **and rendered by the Quill editor**.
> This module uses [queueMicrotask](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask) to get the selection after Quill updated the DOM.
> That means that something else could happen between the transformation and its rendering
> in the editor.

```typescript
( shortcut?: string, emoji?: string, delta?: Delta, selection?: RangeStatic | null) => void;
```

**Example**

```typescript
// ...

modules: {
    emojiParser: {
        onUpdated(shortcut: string, emoji: string, delta: Delta, selection: RangeStatic | null) {
            // The shortcut that was parsed.
            console.log(shortcut);

            // The emoji found.
            console.log(emoji);

            // The modified delta.
            console.log(delta);

            // The selection after modification.
            console.log(selection);
        }
    }
}
```

## Bundle size

|                 | UMD      | UMD gzipped | Module   | Module gzipped |
| --------------- | -------- | ----------- | -------- | -------------- |
| `.`             | 22.37 kB | 8.94 kB     | 29.47 kB | 9.49 kB        |
| `./base`        | 5.34 kB  | 1.71 kB     | 8.58 kB  | 2.14 kB        |
| `./default-map` | 17.43 kB | 7.39 kB     | 21.03 kB | 7.35 kB        |

## Todos

- [ ] Allow reverting transformation and keeping shortcuts on `backspace` input.
- [ ] Tests
- [x] Two entries: one with default map, one without map **v0.9.0**.

## Known Bugs

- [ ] When dynamically changing the `bypass` options, selection is not always accurate.

## License

MIT © Benoît Lahoz

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fbenoitlahoz%2Fquill-emoji-parser.svg?type=large&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fbenoitlahoz%2Fquill-emoji-parser?ref=badge_large&issueType=license)
