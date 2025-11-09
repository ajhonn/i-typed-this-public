import { useCallback, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import type { Transaction } from '@tiptap/pm/state';
import { useSession } from '@features/session/SessionProvider';
import { createRecorderEvent } from './utils';
import { getPendingPastePayload, setPendingPastePayload } from '@features/playback/extensions/PasteCaptureExtension';
import { useDomRecorder } from './domRecorder';
import type { RecorderEvent } from './types';

const DOM_TRANSACTION_LINK_WINDOW_MS = 150;

type DomEventLink = {
  id: string;
  type: RecorderEvent['type'];
  timestamp: number;
};

export const useRecorder = (editor: Editor | null) => {
  const { appendEvent, setRecorderState } = useSession();
  const lastTimestampRef = useRef<number | null>(null);
  const pendingPasteRef = useRef<RecorderEvent['meta']['pastePayload'] | null>(null);
  const domEventQueueRef = useRef<DomEventLink[]>([]);

  const handleDomEventCaptured = useCallback((event: RecorderEvent) => {
    if (event.type === 'text-input' || event.type === 'delete') {
      domEventQueueRef.current.push({ id: event.id, type: event.type, timestamp: event.timestamp });
    }
  }, []);

  useDomRecorder(editor, handleDomEventCaptured);

  useEffect(() => {
    if (!editor) {
      setRecorderState('idle');
      return;
    }
    setRecorderState('recording');
    return () => {
      setRecorderState('idle');
    };
  }, [editor, setRecorderState]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const correlateWithDomEvent = (event: RecorderEvent) => {
      if (event.type !== 'text-input' && event.type !== 'delete') {
        return;
      }
      const queue = domEventQueueRef.current;
      for (let i = queue.length - 1; i >= 0; i -= 1) {
        const candidate = queue[i];
        if (event.timestamp - candidate.timestamp > DOM_TRANSACTION_LINK_WINDOW_MS) {
          queue.splice(i, 1);
          continue;
        }
        if (candidate.type === event.type && Math.abs(event.timestamp - candidate.timestamp) <= DOM_TRANSACTION_LINK_WINDOW_MS) {
          event.meta.correlatedDomEventId = candidate.id;
          queue.splice(i, 1);
          break;
        }
      }
    };

    const handleTransaction = ({ transaction }: { transaction: Transaction }) => {
      if (!transaction) {
        return;
      }

      const now = Date.now();
      const durationMs =
        lastTimestampRef.current != null ? now - lastTimestampRef.current : undefined;
      lastTimestampRef.current = now;

      const htmlSnapshot = editor.getHTML();
      const event = createRecorderEvent(transaction, htmlSnapshot, durationMs);
      const freshPayload = getPendingPastePayload();
      if (freshPayload) {
        pendingPasteRef.current = freshPayload;
      }

      if (pendingPasteRef.current && transaction.docChanged) {
        event.type = 'paste';
        event.meta.pastePayload = pendingPasteRef.current;
        setPendingPastePayload(null);
        pendingPasteRef.current = null;
      }
      correlateWithDomEvent(event);

      appendEvent(event);
    };

    editor.on('transaction', handleTransaction);

    return () => {
      editor.off('transaction', handleTransaction);
      domEventQueueRef.current = [];
    };
  }, [editor, appendEvent]);
};
