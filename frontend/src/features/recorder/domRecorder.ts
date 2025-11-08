import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { useSession } from '@features/session/SessionProvider';
import type { RecorderEvent } from './types';

const DOM_EVENT_TYPES = new Set([
  'insertText',
  'deleteContentBackward',
  'deleteContentForward',
  'insertFromPaste',
]);

export const useDomRecorder = (editor: Editor | null) => {
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
        id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
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
    };

    dom.addEventListener('input', handleInput);
    return () => dom.removeEventListener('input', handleInput);
  }, [editor, appendEvent]);
};
