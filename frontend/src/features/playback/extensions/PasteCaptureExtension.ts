import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

export type PastePayload = {
  length: number;
  preview: string;
  source: 'external';
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
            const payload = {
              length: text.length,
              preview: text.slice(0, 200),
              source: 'external' as const,
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
