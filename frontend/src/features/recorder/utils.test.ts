import { describe, expect, it } from 'vitest';
import type { Transaction } from '@tiptap/pm/state';
import { createRecorderEvent } from './utils';

const buildTransaction = (overrides: Partial<Transaction> = {}) =>
  ({
    docChanged: true,
    selectionSet: false,
    selection: { from: 1, to: 1 },
    doc: { content: { size: 100 } },
    steps: [
      {
        toJSON: () => ({
          stepType: 'replace',
          slice: { content: [{ type: 'text', text: 'hello' }] },
        }),
      },
    ],
    ...overrides,
  } as unknown as Transaction);

describe('createRecorderEvent', () => {
  it('classifies text input', () => {
    const transaction = buildTransaction();
    const event = createRecorderEvent(transaction, '<p>hello</p>', 120);
    expect(event.type).toBe('text-input');
    expect(event.source).toBe('transaction');
    expect(event.meta.docSize).toBe(100);
    expect(event.meta.html).toBe('<p>hello</p>');
    expect(event.meta.durationMs).toBe(120);
  });

  it('classifies deletes', () => {
    const transaction = buildTransaction({
      steps: [
        {
          toJSON: () => ({
            stepType: 'replace',
          }),
        },
      ],
    });
    const event = createRecorderEvent(transaction, '<p>hello</p>');
    expect(event.type).toBe('delete');
  });

  it('classifies selection change', () => {
    const transaction = buildTransaction({
      docChanged: false,
      selectionSet: true,
    });
    const event = createRecorderEvent(transaction, '<p>hello</p>');
    expect(event.type).toBe('selection-change');
  });
});
