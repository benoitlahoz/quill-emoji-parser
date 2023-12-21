# quill-emoji-parser

---

Checks for emojis shortcuts during typing and pasting and replace them by their visual counterpart.

Very much inspired by [quill-magic-url](https://github.com/visualjerk/quill-magic-url/) and the answer to [this Stack Overflow question](https://stackoverflow.com/questions/77667011/in-quill-how-to-parse-deltas-and-replace-some-of-its-content).

## Install

From CDN

```
<!-- After quill script includes -->
<script src="https://unpkg.com/quill-emoji-parser@1.0.0/dist/quill-emoji-parser.min.js"></script>
```

With NPM or Yarn

```
npm install quill-emoji-parser

yarn add quill-emoji-parser
```

```typescript
import Quill from 'quill';
import EmojiParser from 'quill-emoji-parser';

Quill.register('modules/emojiParser', EmojiParser);
```

## Usage

**Basic usage with default options:**

```typescript
const quill = new Quill(editor, {
  modules: {
    emojiParser: true,
  },
});
```

**Usage with custom options:**

```typescript
const quill = new Quill(editor, {
  modules: {
    emojiParser: {
      // Will remove shortcuts between ':'.
      removeShortcut: /(:([^:]+):)/gi,
      // Will remove specific emojis.
      removeEmoji: ['😈', '😜'],

      // For other options, see below...
    },
  },
});
```

## Options

All options are undefined or false by default.

### removeShortcut

> Remove some shortcuts from the emoji map.

```typescript
RegExp | Array<string> | string;
```

**Example**

```typescript
// ...

modules: {
    emojiParser: {
        removeShortcut: /(:([^:]+):)/gi,
    }

    // or

    emojiParser: {
        // Strings separated by space.
        removeShortcut: ':open_mouth: :poop:'
    }

    // or

    emojiParser: {
        // Array of strings.
        removeShortcut: [':open_mouth:', ':poop:']
    }
}
```

### remojeEmoji

> Remove some emojis from the emoji map.

```typescript
RegExp | Array<string> | string;
```

**Example**

```typescript
// ...

modules: {
    emojiParser: {
        // Removes... all emojis...
        removeEmoji: /\p{Emoji_Presentation}/gu,
    }

    // or

    emojiParser: {
        // Strings separated by space.
        removeEmoji: '😮 💩'
    }

    // or

    emojiParser: {
        // Array of strings.
        removeEmoji: ['😮', '💩']
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
    parseOnBlur: true;
  }
}
```

### onBeforePaste

> Function called before parsing pasted text.

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
> To actually parse the shortcut it must return `true`.

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
> The module uses [queueMicrotask](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask) to get the selection after Quill updated the DOM.

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
