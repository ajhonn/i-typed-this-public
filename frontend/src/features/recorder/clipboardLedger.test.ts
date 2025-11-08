import { afterEach, describe, expect, it } from 'vitest';
import { clearClipboardLedger, matchClipboardText, recordClipboardEntry } from './clipboardLedger';

describe('clipboardLedger', () => {
  afterEach(() => {
    clearClipboardLedger();
  });

  it('matches clipboard text that was copied recently', () => {
    const now = Date.now();
    recordClipboardEntry({
      id: 'evt-copy',
      action: 'copy',
      text: 'Internal payload',
      selection: { from: 0, to: 16 },
      timestamp: now,
    });

    const match = matchClipboardText('Internal payload');
    expect(match).not.toBeNull();
    expect(match?.id).toBe('evt-copy');
  });

  it('ignores empty clipboard payloads', () => {
    const entry = recordClipboardEntry({
      id: 'evt-empty',
      action: 'copy',
      text: '',
      selection: { from: 0, to: 0 },
    });
    expect(entry).toBeNull();
  });
});
