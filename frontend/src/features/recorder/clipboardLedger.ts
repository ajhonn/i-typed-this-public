const LEDGER_LIMIT = 50;
const LEDGER_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type ClipboardLedgerAction = 'copy' | 'cut';

export type ClipboardLedgerEntry = {
  id: string;
  timestamp: number;
  action: ClipboardLedgerAction;
  text: string;
  length: number;
  hash: string;
  preview: string;
  selection: {
    from: number;
    to: number;
  };
};

const ledger: ClipboardLedgerEntry[] = [];

const normalizeText = (text: string) => {
  return text.replace(/\s+/g, ' ').trim();
};

const fnv1a = (text: string) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>> 0;
  }
  return hash.toString(36);
};

const pruneLedger = (now: number) => {
  for (let i = ledger.length - 1; i >= 0; i -= 1) {
    if (now - ledger[i].timestamp > LEDGER_TTL_MS) {
      ledger.splice(i, 1);
    }
  }
  if (ledger.length > LEDGER_LIMIT) {
    ledger.splice(0, ledger.length - LEDGER_LIMIT);
  }
};

export const recordClipboardEntry = ({
  id,
  text,
  action,
  selection,
  timestamp = Date.now(),
}: {
  id: string;
  text: string;
  action: ClipboardLedgerAction;
  selection: { from: number; to: number };
  timestamp?: number;
}) => {
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }
  pruneLedger(timestamp);
  const entry: ClipboardLedgerEntry = {
    id,
    timestamp,
    action,
    text: normalized,
    length: normalized.length,
    hash: fnv1a(normalized),
    preview: normalized.slice(0, 200),
    selection,
  };
  ledger.push(entry);
  return entry;
};

export const matchClipboardText = (text: string) => {
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }
  const now = Date.now();
  pruneLedger(now);
  const hash = fnv1a(normalized);
  return ledger.find((entry) => entry.hash === hash && entry.length === normalized.length) ?? null;
};

export const clearClipboardLedger = () => {
  ledger.splice(0, ledger.length);
};
