import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { useSession } from '@features/session/SessionProvider';
import type { RecorderEvent } from './types';
import { createRecorderEventId } from './utils';
import { recordClipboardEntry } from './clipboardLedger';

const DOM_EVENT_TYPES = new Set([
  'insertText',
  'deleteContentBackward',
  'deleteContentForward',
  'insertFromPaste',
]);

export const useDomRecorder = (editor: Editor | null, onDomEventCaptured?: (event: RecorderEvent) => void) => {
  const { appendEvent } = useSession();
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const handleInput = (event: InputEvent) => {
      if (!DOM_EVENT_TYPES.has(event.inputType)) {
        return;
      }
      const now = Date.now();
      const durationMs =
        lastTimestampRef.current != null ? now - lastTimestampRef.current : undefined;
      lastTimestampRef.current = now;

      const selection = editor.state.selection;
      const domEventType =
        event.inputType === 'insertFromPaste'
          ? 'paste'
          : event.inputType.startsWith('delete')
            ? 'delete'
            : 'text-input';

      const domEvent: RecorderEvent = {
        id: createRecorderEventId(),
        type: domEventType,
        source: 'dom',
        timestamp: now,
        meta: {
          docSize: editor.state.doc.content.size,
          stepTypes: [],
          selection: { from: selection.from, to: selection.to },
          docChanged: true,
          html: editor.getHTML(),
          durationMs,
          domInput: {
            inputType: event.inputType,
            data: event.data,
          },
        },
      };

      if (import.meta.env.DEV && domEventType === 'paste') {
        const preview = (event.data ?? '').slice(0, 40);
        console.info('[Recorder] DOM paste captured', { length: event.data?.length ?? 0, preview, durationMs });
      }

      appendEvent(domEvent);
      onDomEventCaptured?.(domEvent);
    };

    const handleClipboard = (action: 'copy' | 'cut') => () => {
      const selection = editor.state.selection;
      if (selection.empty) {
        return;
      }
      const text = editor.state.doc.textBetween(selection.from, selection.to, '\n');
      if (!text) {
        return;
      }

      const timestamp = Date.now();
      const id = createRecorderEventId();
      const entry = recordClipboardEntry({
        id,
        action,
        text,
        selection: { from: selection.from, to: selection.to },
        timestamp,
      });
      if (!entry) {
        return;
      }

      const clipboardEvent: RecorderEvent = {
        id,
        type: action,
        source: 'dom',
        timestamp,
        meta: {
          docSize: editor.state.doc.content.size,
          stepTypes: [],
          selection: { from: selection.from, to: selection.to },
          docChanged: false,
          html: editor.getHTML(),
          clipboard: {
            action,
            length: entry.length,
            preview: entry.preview,
            hash: entry.hash,
          },
        },
      };

      if (import.meta.env.DEV) {
        console.info('[Recorder] Clipboard event captured', {
          action,
          length: entry.length,
          preview: entry.preview.slice(0, 40),
        });
      }

      appendEvent(clipboardEvent);
    };

    const handleCopy = handleClipboard('copy');
    const handleCut = handleClipboard('cut');

    dom.addEventListener('input', handleInput);
    dom.addEventListener('copy', handleCopy);
    dom.addEventListener('cut', handleCut);
    return () => {
      dom.removeEventListener('input', handleInput);
      dom.removeEventListener('copy', handleCopy);
      dom.removeEventListener('cut', handleCut);
    };
  }, [editor, appendEvent, onDomEventCaptured]);
};
