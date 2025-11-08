import type { Transaction } from '@tiptap/pm/state';
import type { RecorderEvent, RecorderEventType } from './types';

export const createRecorderEventId = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const detectEventType = (transaction: Transaction): RecorderEventType => {
  const hasMetaAccessor = typeof transaction.getMeta === 'function';
  if (hasMetaAccessor && transaction.getMeta('pastePayload')) {
    return 'paste';
  }

  if (!transaction.docChanged) {
    return transaction.selectionSet ? 'selection-change' : 'transaction';
  }

  const steps = transaction.steps.map((step) => step.toJSON?.() ?? {});
  const hasInsert = steps.some((json) => {
    const slice = json.slice as { content?: unknown[] } | undefined;
    return Array.isArray(slice?.content) && slice!.content!.length > 0;
  });
  const hasDelete = steps.some((json) => {
    const slice = json.slice as { content?: unknown[] } | undefined;
    return json.stepType === 'replace' && (!slice || !slice.content || slice.content.length === 0);
  });

  if (hasInsert && !hasDelete) return 'text-input';
  if (hasDelete && !hasInsert) return 'delete';
  return 'transaction';
};

export const createRecorderEvent = (
  transaction: Transaction,
  html: string,
  durationMs?: number
): RecorderEvent => {
  return {
    id: createRecorderEventId(),
    type: detectEventType(transaction),
    timestamp: Date.now(),
    source: 'transaction',
    meta: {
      docSize: transaction.doc.content.size,
      stepTypes: transaction.steps.map((step) => step.toJSON?.()?.stepType ?? 'unknown'),
      selection: {
        from: transaction.selection.from,
        to: transaction.selection.to,
      },
      docChanged: transaction.docChanged,
      html,
      durationMs,
    },
  };
};
