import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import type { RecorderEvent } from '@features/recorder/types';
import type { SessionState } from './SessionProvider';
import {
  buildArchiveFilename,
  createSessionArchive,
  finalizeSessionArchive,
  parseSessionArchive,
  prepareSessionArchive,
} from './sessionArchive';

const mockEvent: RecorderEvent = {
  id: 'evt-1',
  type: 'transaction',
  source: 'transaction',
  timestamp: Date.now(),
  meta: {
    docSize: 4,
    stepTypes: [],
    selection: { from: 0, to: 0 },
    docChanged: true,
    html: '<p>test</p>',
  },
};

const sampleSession: SessionState = {
  sessionId: 'session-sample',
  editorHTML: '<p>hello</p>',
  events: [mockEvent],
};

describe('sessionArchive', () => {
  it('creates a signed archive that round-trips successfully', async () => {
    const { blob, manifest } = await createSessionArchive(sampleSession);

    expect(manifest.sessionHash).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.files.session).toBe('session.json');

    const parsed = await parseSessionArchive(blob);
    expect(parsed.session).toEqual(sampleSession);
    expect(parsed.manifest.sessionHash).toEqual(manifest.sessionHash);
  });

  it('rejects archives when the session payload is tampered with', async () => {
    const { blob } = await createSessionArchive(sampleSession);
    const zip = await JSZip.loadAsync(blob);
    zip.file('session.json', JSON.stringify({ ...sampleSession, editorHTML: '<p>tampered</p>' }, null, 2));
    const tamperedBlob = await zip.generateAsync({ type: 'blob' });

    await expect(parseSessionArchive(tamperedBlob)).rejects.toThrow(/hash mismatch/i);
  });

  it('builds descriptive filenames from the editor text and date', () => {
    const filename = buildArchiveFilename(sampleSession, '2025-01-07T12:00:00.000Z');
    expect(filename).toBe('hello-2025-01-07-i-typed-this.zip');
  });

  it('persists ledger receipt metadata when provided during finalization', async () => {
    const prepared = await prepareSessionArchive(sampleSession);
    const { manifest } = await finalizeSessionArchive(prepared, {
      ledgerReceipt: {
        receiptId: 'receipt-ledger',
        hashVersion: 'v1',
        registeredAt: '2025-01-01T00:00:00.000Z',
      },
    });
    expect(manifest.ledgerReceipt).toEqual({
      receiptId: 'receipt-ledger',
      hashVersion: 'v1',
      registeredAt: '2025-01-01T00:00:00.000Z',
    });
  });
});
