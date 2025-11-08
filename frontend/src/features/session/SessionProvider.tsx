import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { RecorderEvent } from '@features/recorder/types';

type SessionState = {
  editorHTML: string;
  events: RecorderEvent[];
};

type RecorderState = 'idle' | 'recording';

type SessionContextValue = {
  session: SessionState;
  setEditorHTML: (html: string) => void;
  appendEvent: (event: RecorderEvent) => void;
  clearSession: () => void;
  recorderState: RecorderState;
  setRecorderState: (state: RecorderState) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);
const MAX_EVENTS = 2000;

const INITIAL_SESSION: SessionState = {
  editorHTML: '<p></p>',
  events: [],
};

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<SessionState>(INITIAL_SESSION);
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
    setSession(INITIAL_SESSION);
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
      recorderState,
      setRecorderState,
    }),
    [session, setEditorHTML, appendEvent, clearSession, recorderState, setRecorderState]
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
