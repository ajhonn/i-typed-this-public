import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { matchClipboardText } from '@features/recorder/clipboardLedger';

export type PastePayload = {
  text: string;
  length: number;
  preview: string;
  source: 'ledger' | 'external';
  matchedCopyId?: string;
  ledgerAgeMs?: number;
};

let pendingPayload: PastePayload | null = null;

export const setPendingPastePayload = (payload: PastePayload | null) => {
  pendingPayload = payload;
};

export const getPendingPastePayload = () => pendingPayload;

let pendingUnmatchedAlert: { text: string } | null = null;

export const consumePendingUnmatchedAlert = () => {
  const alert = pendingUnmatchedAlert;
  pendingUnmatchedAlert = null;
  return alert;
};

export const PasteCaptureExtension = Extension.create({
  name: 'pasteCapture',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (_view, event) => {
            const rawText = event.clipboardData?.getData('text/plain') ?? '';
            const normalized = rawText.replace(/\s+/g, ' ').trim();
            const now = Date.now();
            const ledgerMatch = matchClipboardText(rawText);
            const payload: PastePayload = {
              text: rawText,
              length: rawText.length,
              preview: rawText.slice(0, 200),
              source: ledgerMatch ? 'ledger' : 'external',
              matchedCopyId: ledgerMatch?.id,
              ledgerAgeMs: ledgerMatch ? now - ledgerMatch.timestamp : undefined,
            };
            if (!ledgerMatch && normalized) {
              pendingUnmatchedAlert = { text: rawText };
            }
            setPendingPastePayload(payload);
            if (import.meta.env.DEV) {
              console.info('[Recorder] handlePaste payload captured', payload);
            }
            return false;
          },
        },
      }),
    ];
  },
});
