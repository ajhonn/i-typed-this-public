import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import type { Transaction } from '@tiptap/pm/state';
import { useSession } from '@features/session/SessionProvider';
import { createRecorderEvent } from './utils';
import { getPendingPastePayload, setPendingPastePayload } from '@features/playback/extensions/PasteCaptureExtension';
import { useDomRecorder } from './domRecorder';

export const useRecorder = (editor: Editor | null) => {
  const { appendEvent, setRecorderState } = useSession();
  const lastTimestampRef = useRef<number | null>(null);
  const pendingPasteRef = useRef<RecorderEvent['meta']['pastePayload'] | null>(null);

  useDomRecorder(editor);

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

      appendEvent(event);
    };

    editor.on('transaction', handleTransaction);

    return () => {
      editor.off('transaction', handleTransaction);
    };
  }, [editor, appendEvent]);
};
