import Quill from 'quill';
import EmojiParserBase, { EmojiParserOptions } from '../classes/emoji.parser';

class EmojiParser extends EmojiParserBase {
  constructor(quill: Quill, options: EmojiParserOptions) {
    if (!options.map) {
      throw new Error(
        "quill-emoji-parser: Please provide a correspondance `map` in module's options."
      );
    }
    super(quill, options);
  }
}

export { EmojiParser as default };

if (window != null && window.Quill) {
  window.Quill.register('modules/emojiParser', EmojiParser);
}
