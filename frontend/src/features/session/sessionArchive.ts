import JSZip from 'jszip';
import type { SessionState } from '@features/session/SessionProvider';
import type { RecorderEvent } from '@features/recorder/types';
import { generateSessionId } from './sessionId';

export const SESSION_ARCHIVE_VERSION = '1.0.0';
export const SESSION_ARCHIVE_README = [
  '# i-typed-this Session Archive',
  '',
  'Thanks for sharing your writing session!',
  '',
  'How to replay:',
  '1. Go to https://i-typed-this.com/playback',
  '2. Click “Upload signed session archive”',
  '3. Pick this zip file — the site will double-check it and open the playback view automatically.',
  '',
  'Inside this zip:',
  '- session.json — your actual writing session',
  '- manifest.json — info the site uses to confirm the file is authentic',
  '- README.txt — these steps for reviewers',
  '',
  'Tip: keep the file zipped so reviewers get the README and session together.',
].join('\n');

const textEncoder = new TextEncoder();

export type SessionArchiveManifest = {
  version: string;
  createdAt: string;
  hashAlgorithm: 'SHA-256';
  sessionHash: string;
  sessionId?: string;
  ledgerReceipt?: {
    receiptId: string;
    hashVersion: string;
    registeredAt: string;
  };
  files: {
    session: string;
    readme: string;
  };
  notes?: string[];
};

const bufferToHex = (buffer: ArrayBuffer) => {
  const view = new Uint8Array(buffer);
  return Array.from(view)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const computeSessionHash = async (payload: string) => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto subtle digest is not available in this environment.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', textEncoder.encode(payload));
  return bufferToHex(digest);
};

const isRecorderEvent = (candidate: unknown): candidate is RecorderEvent => {
  if (!candidate || typeof candidate !== 'object') return false;
  const value = candidate as RecorderEvent;
  return (
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    typeof value.timestamp === 'number' &&
    typeof value.meta === 'object' &&
    value.meta !== null &&
    typeof value.meta.html === 'string'
  );
};

const parseSessionJson = (payload: string): SessionState => {
  const parsed = JSON.parse(payload);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Session payload must be an object.');
  }

  const editorHTML = typeof parsed.editorHTML === 'string' ? parsed.editorHTML : '<p></p>';
  if (!Array.isArray(parsed.events)) {
    throw new Error('Session payload is missing an events array.');
  }
  const events = parsed.events;
  if (!events.every(isRecorderEvent)) {
    throw new Error('Session payload contains malformed recorder events.');
  }

  const sessionId =
    typeof parsed.sessionId === 'string' && parsed.sessionId.length ? parsed.sessionId : generateSessionId();

  return { sessionId, editorHTML, events };
};

const serializeSessionPayload = (session: SessionState) => ({
  sessionId: session.sessionId,
  editorHTML: session.editorHTML,
  events: session.events,
});

export type PreparedSessionArchive = {
  sessionJson: string;
  manifest: SessionArchiveManifest;
};

export const prepareSessionArchive = async (session: SessionState): Promise<PreparedSessionArchive> => {
  const sessionPayload = serializeSessionPayload(session);
  const sessionJson = JSON.stringify(sessionPayload, null, 2);
  const sessionHash = await computeSessionHash(sessionJson);
  const manifest: SessionArchiveManifest = {
    version: SESSION_ARCHIVE_VERSION,
    createdAt: new Date().toISOString(),
    hashAlgorithm: 'SHA-256',
    sessionHash,
    sessionId: session.sessionId,
    files: {
      session: 'session.json',
      readme: 'README.txt',
    },
    notes: ['Bundle generated client-side. Do not edit files before verification.'],
  };

  return { sessionJson, manifest };
};

const buildArchiveBlob = async (sessionJson: string, manifest: SessionArchiveManifest) => {
  const zip = new JSZip();
  zip.file(manifest.files.session, sessionJson);
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file(manifest.files.readme, SESSION_ARCHIVE_README);

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return { blob, manifest };
};

export const finalizeSessionArchive = async (
  prepared: PreparedSessionArchive,
  overrides?: { ledgerReceipt?: SessionArchiveManifest['ledgerReceipt'] },
) => {
  const manifest: SessionArchiveManifest = {
    ...prepared.manifest,
    ledgerReceipt: overrides?.ledgerReceipt ?? prepared.manifest.ledgerReceipt,
  };
  return buildArchiveBlob(prepared.sessionJson, manifest);
};

export const createSessionArchive = async (
  session: SessionState,
  options?: { ledgerReceipt?: SessionArchiveManifest['ledgerReceipt'] }
) => {
  const prepared = await prepareSessionArchive(session);
  return finalizeSessionArchive(prepared, options);
};

export const parseSessionArchive = async (file: Blob) => {
  const zip = await JSZip.loadAsync(file);

  const manifestEntry = zip.file('manifest.json');
  if (!manifestEntry) {
    throw new Error('Archive is missing manifest.json.');
  }

  const manifest: SessionArchiveManifest = JSON.parse(await manifestEntry.async('string'));
  if (manifest.hashAlgorithm !== 'SHA-256') {
    throw new Error(`Unsupported hash algorithm: ${manifest.hashAlgorithm}`);
  }

  const sessionEntry = zip.file(manifest.files?.session ?? 'session.json');
  if (!sessionEntry) {
    throw new Error('Archive is missing the recorded session payload.');
  }

  const sessionJson = await sessionEntry.async('string');
  const computedHash = await computeSessionHash(sessionJson);
  if (computedHash !== manifest.sessionHash) {
    throw new Error('Session hash mismatch. The archive may have been modified.');
  }

  const session = parseSessionJson(sessionJson);

  const readmeEntry = zip.file(manifest.files?.readme ?? 'README.txt');
  if (!readmeEntry) {
    throw new Error('Archive is missing README.txt for reviewer context.');
  }

  return { session, manifest };
};

const stripHtml = (html: string) => {
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent?.trim() ?? '';
  }
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'session';

export const buildArchiveFilename = (session: SessionState, createdAtISO: string) => {
  const textPreview = stripHtml(session.editorHTML).slice(0, 32) || 'session';
  const slug = slugify(textPreview);
  const datePart = createdAtISO.slice(0, 10).replace(/[^0-9-]/g, '') || new Date().toISOString().slice(0, 10);
  return `${slug || 'session'}-${datePart}-i-typed-this.zip`;
};
