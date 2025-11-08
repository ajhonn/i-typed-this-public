import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { matchClipboardText } from '@features/recorder/clipboardLedger';

export type PastePayload = {
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

export const PasteCaptureExtension = Extension.create({
  name: 'pasteCapture',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (_view, event) => {
            const text = event.clipboardData?.getData('text/plain') ?? '';
            const now = Date.now();
            const ledgerMatch = matchClipboardText(text);
            const payload: PastePayload = {
              length: text.length,
              preview: text.slice(0, 200),
              source: ledgerMatch ? 'ledger' : 'external',
              matchedCopyId: ledgerMatch?.id,
              ledgerAgeMs: ledgerMatch ? now - ledgerMatch.timestamp : undefined,
            };
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
