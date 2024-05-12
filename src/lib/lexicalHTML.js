import { $getRoot } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';

/**
 * @param {LexicalEditor} editor
 * @returns {Promise<string>}
 */
export async function toHTML(editor) {
  return new Promise((resolve) => {
    editor.update(() => {
      const textInEditor = $getRoot().getTextContent().trim()

      if (textInEditor.length > 0) {
        resolve($generateHtmlFromNodes(editor, null))
      } else {
        resolve('')
      }
    })
  })
}
