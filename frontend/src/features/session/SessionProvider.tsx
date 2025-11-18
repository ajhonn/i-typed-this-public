import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { RecorderEvent } from '@features/recorder/types';
import { generateSessionId } from './sessionId';

export type SessionLedgerInfo = {
  receiptId?: string;
  hashVersion?: string;
  firstSeenAt?: string;
  lastVerifiedAt?: string;
  status?: 'registered' | 'verified' | 'mismatch' | 'unknown' | 'error';
  message?: string;
};

export type SessionState = {
  sessionId: string;
  editorHTML: string;
  events: RecorderEvent[];
  ledger?: SessionLedgerInfo;
};

type RecorderState = 'idle' | 'recording';

type SessionContextValue = {
  session: SessionState;
  setEditorHTML: (html: string) => void;
  appendEvent: (event: RecorderEvent) => void;
  clearSession: () => void;
  loadSession: (next: SessionState) => void;
  recorderState: RecorderState;
  setRecorderState: (state: RecorderState) => void;
  setLedgerInfo: (info: SessionLedgerInfo | null) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);
// TODO(recorder): replace this coarse limit with memory-aware trimming/streaming.
const MAX_EVENTS = 1_000_000;

const createInitialSession = (): SessionState => ({
  sessionId: generateSessionId(),
  editorHTML: '<p></p>',
  events: [],
});

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<SessionState>(() => createInitialSession());
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');

  const setEditorHTML = useCallback((html: string) => {
    setSession((prev) => ({
      ...prev,
      editorHTML: html,
    }));
  }, []);

  const appendEvent = useCallback((event: RecorderEvent) => {
    setSession((prev) => {
      const nextEvents = [...prev.events, event];
      if (nextEvents.length > MAX_EVENTS) {
        nextEvents.splice(0, nextEvents.length - MAX_EVENTS);
      }

      return {
        ...prev,
        events: nextEvents,
      };
    });
  }, []);

  const clearSession = useCallback(() => {
    setSession(createInitialSession());
  }, []);

  const loadSession = useCallback((next: SessionState) => {
    setSession({
      sessionId: typeof next.sessionId === 'string' && next.sessionId.length ? next.sessionId : generateSessionId(),
      editorHTML: typeof next.editorHTML === 'string' && next.editorHTML.length ? next.editorHTML : '<p></p>',
      events: Array.isArray(next.events) ? next.events.slice(0, MAX_EVENTS) : [],
      ledger: next.ledger,
    });
  }, []);

  const setLedgerInfo = useCallback((info: SessionLedgerInfo | null) => {
    setSession((prev) => ({
      ...prev,
      ledger: info ?? undefined,
    }));
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const devWindow = window as typeof window & {
        __getRecorderSession?: () => SessionState;
        __recorderDebugNotified?: boolean;
      };
      devWindow.__getRecorderSession = () => session;
      if (!devWindow.__recorderDebugNotified) {
        console.info('[Recorder] Debug helper ready: call window.__getRecorderSession() in DevTools to inspect events.');
        devWindow.__recorderDebugNotified = true;
      }
    }
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      setEditorHTML,
      appendEvent,
      clearSession,
      loadSession,
      recorderState,
      setRecorderState,
      setLedgerInfo,
    }),
    [session, setEditorHTML, appendEvent, clearSession, loadSession, recorderState, setRecorderState, setLedgerInfo]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
};
