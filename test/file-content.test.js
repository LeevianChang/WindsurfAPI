import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractImages } from '../src/image.js';

function dataUrl(mime, text) {
  return `data:${mime};base64,${Buffer.from(text, 'utf8').toString('base64')}`;
}

describe('file content extraction', () => {
  it('extracts Cherry/OpenAI-style top-level input_file text data', async () => {
    const result = await extractImages([
      { type: 'text', text: 'summarize this:' },
      {
        type: 'input_file',
        filename: 'notes.md',
        file_data: dataUrl('text/markdown', '# Title\nhello from attachment'),
      },
    ]);

    assert.equal(result.images.length, 0);
    assert.match(result.text, /summarize this:/);
    assert.match(result.text, /\[File "notes\.md" — text\/markdown\]/);
    assert.match(result.text, /hello from attachment/);
  });

  it('extracts nested file text data', async () => {
    const result = await extractImages([
      {
        type: 'file',
        file: {
          filename: 'data.json',
          file_data: dataUrl('application/json', '{"ok":true}'),
        },
      },
    ]);

    assert.match(result.text, /\[File "data\.json" — application\/json\]/);
    assert.match(result.text, /{"ok":true}/);
  });

  it('recognizes pdf files even when the data URL is octet-stream', async () => {
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF', 'latin1').toString('base64');
    const result = await extractImages([
      {
        type: 'input_file',
        filename: 'paper.pdf',
        file_data: `data:application/octet-stream;base64,${pdf}`,
      },
    ]);

    assert.match(result.text, /\[PDF Document "paper\.pdf" — no extractable text/);
  });
});
