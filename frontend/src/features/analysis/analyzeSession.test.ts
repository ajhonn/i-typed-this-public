import { describe, expect, it } from 'vitest';
import type { RecorderEvent } from '@features/recorder/types';
import { analyzeSession } from './analyzeSession';

const randomId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const mockEvent = (overrides: Partial<RecorderEvent>): RecorderEvent => ({
  id: overrides.id ?? randomId(),
  type: overrides.type ?? 'text-input',
  timestamp: overrides.timestamp ?? Date.now(),
  source: overrides.source ?? 'dom',
  meta: {
    docSize: overrides.meta?.docSize ?? 0,
    stepTypes: overrides.meta?.stepTypes ?? [],
    selection: overrides.meta?.selection ?? { from: 0, to: 0 },
    docChanged: overrides.meta?.docChanged ?? true,
    html: overrides.meta?.html ?? '<p></p>',
    durationMs: overrides.meta?.durationMs,
    domInput: overrides.meta?.domInput,
    pastePayload: overrides.meta?.pastePayload,
    clipboard: overrides.meta?.clipboard,
  },
});

describe('analyzeSession', () => {
  it('computes pause, revision, and paste signals', () => {
    const events: RecorderEvent[] = [
      mockEvent({
        timestamp: 0,
        meta: { html: '<p>H</p>', domInput: { inputType: 'insertText', data: 'H' }, docSize: 1, selection: { from: 1, to: 1 } },
      }),
      mockEvent({
        timestamp: 120,
        meta: { html: '<p>He</p>', domInput: { inputType: 'insertText', data: 'e' }, docSize: 2, selection: { from: 2, to: 2 } },
      }),
      mockEvent({
        timestamp: 700,
        meta: { html: '<p>Hel</p>', domInput: { inputType: 'insertText', data: 'l' }, docSize: 3, selection: { from: 3, to: 3 } },
      }),
      mockEvent({
        type: 'delete',
        timestamp: 2500,
        meta: { html: '<p>H</p>', domInput: { inputType: 'deleteContentBackward', data: 'e' }, docSize: 1, selection: { from: 1, to: 1 } },
      }),
      mockEvent({
        type: 'paste',
        source: 'transaction',
        timestamp: 8000,
        meta: {
          html: '<p>Hello world</p>',
          docSize: 11,
          selection: { from: 11, to: 11 },
          pastePayload: {
            text: ' world',
            length: 6,
            preview: ' world',
            source: 'external',
          },
        },
      }),
    ];

    const result = analyzeSession(events, '<p>Hello world</p>');

    expect(result.metrics.length).toBeGreaterThan(0);
    expect(result.signals.pasteAnomalyCount).toBeGreaterThanOrEqual(0);
    expect(result.segments.some((segment) => segment.type === 'pause')).toBe(true);
    expect(result.segments.some((segment) => segment.type === 'paste')).toBe(true);
    expect(result.pastes.length).toBeGreaterThan(0);
    expect(result.processProductTimeline.length).toBeGreaterThan(0);
    const lastPoint = result.processProductTimeline[result.processProductTimeline.length - 1];
    expect(lastPoint?.documentChars).toBeGreaterThan(0);
    const macroBucket = result.pauseHistogram.find((bin) => bin.key === 'gt-2000');
    expect(macroBucket?.count).toBe(1);
    const midBucket = result.pauseHistogram.find((bin) => bin.key === '200-1000');
    expect(midBucket?.count).toBe(1);
  });

  it('classifies ledger-matched pastes as internal copies', () => {
    const events: RecorderEvent[] = [
      mockEvent({
        type: 'paste',
        source: 'transaction',
        timestamp: 5000,
        meta: {
          docSize: 20,
          selection: { from: 20, to: 20 },
          html: '<p>Example</p>',
          pastePayload: {
            text: 'import',
            length: 6,
            preview: 'import',
            source: 'ledger',
            matchedCopyId: 'copy-1',
            ledgerAgeMs: 800,
          },
        },
      }),
    ];

    const result = analyzeSession(events, '<p>Example</p>');
    expect(result.pastes[0]?.classification).toBe('internal-copy');
    expect(result.pastes[0]?.ledgerMatch?.copyEventId).toBe('copy-1');
    expect(result.signals.pasteAnomalyCount).toBe(0);
    expect(result.pauseHistogram.every((bin) => typeof bin.count === 'number')).toBe(true);
  });

  it('marks all external pastes as unmatched regardless of size', () => {
    const events: RecorderEvent[] = [
      mockEvent({
        timestamp: 0,
        meta: { html: '<p>Hi</p>', domInput: { inputType: 'insertText', data: 'Hi' }, docSize: 2, selection: { from: 2, to: 2 } },
      }),
      mockEvent({
        type: 'paste',
        source: 'transaction',
        timestamp: 1000,
        meta: {
          html: '<p>Hi there</p>',
          docSize: 8,
          selection: { from: 8, to: 8 },
          pastePayload: {
            text: ' there',
            length: 6,
            preview: ' there',
            source: 'external',
          },
        },
      }),
    ];

    const result = analyzeSession(events, '<p>Hi there</p>');
    expect(result.pastes[0]?.classification).toBe('unmatched');
  });

  it('counts transaction-only deletes as revisions when no DOM event exists', () => {
    const events: RecorderEvent[] = [
      mockEvent({
        timestamp: 0,
        meta: { html: '<p>Hi</p>', domInput: { inputType: 'insertText', data: 'Hi' }, docSize: 2, selection: { from: 2, to: 2 } },
      }),
      mockEvent({
        id: 'txn-delete',
        type: 'delete',
        source: 'transaction',
        timestamp: 2000,
        meta: {
          docSize: 0,
          selection: { from: 0, to: 0 },
          docChanged: true,
          stepTypes: ['replace'],
          html: '<p></p>',
        },
      }),
    ];

    const result = analyzeSession(events, '<p></p>');
    const revisions = result.segments.filter((segment) => segment.type === 'revision');
    expect(revisions).toHaveLength(1);
    const deleted = revisions[0]?.metadata?.deleted as number | undefined;
    expect(deleted).toBeGreaterThanOrEqual(1);
  });
});
