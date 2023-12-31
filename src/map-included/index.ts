import Quill from 'quill';
import EmojiMap from '../maps/emoji.map';
import EmojiParserBase, { EmojiParserOptions } from '../classes/emoji.parser';

export class EmojiParser extends EmojiParserBase {
  constructor(quill: Quill, options?: EmojiParserOptions) {
    super(quill, { map: EmojiMap, ...options });
  }
}

export { EmojiMap };

if (window != null && window.Quill) {
  window.Quill.register('modules/emojiParser', EmojiParser);
}
