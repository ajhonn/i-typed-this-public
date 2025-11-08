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
        type: 'delete',
        timestamp: 2500,
        meta: { html: '<p>H</p>', domInput: { inputType: 'deleteContentBackward', data: 'e' }, docSize: 1, selection: { from: 1, to: 1 } },
      }),
      mockEvent({
        type: 'paste',
        timestamp: 8000,
        meta: { html: '<p>Hello world</p>', domInput: { inputType: 'insertFromPaste', data: ' world' }, docSize: 11, selection: { from: 11, to: 11 } },
      }),
    ];

    const result = analyzeSession(events, '<p>Hello world</p>');

    expect(result.metrics.length).toBeGreaterThan(0);
    expect(result.signals.pasteAnomalyCount).toBeGreaterThanOrEqual(0);
    expect(result.segments.some((segment) => segment.type === 'pause')).toBe(true);
    expect(result.segments.some((segment) => segment.type === 'paste')).toBe(true);
  });
});
