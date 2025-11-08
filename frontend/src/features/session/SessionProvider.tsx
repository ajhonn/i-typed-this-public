import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { RecorderEvent } from '@features/recorder/types';

type SessionState = {
  editorHTML: string;
  events: RecorderEvent[];
};

type SessionContextValue = {
  session: SessionState;
  setEditorHTML: (html: string) => void;
  appendEvent: (event: RecorderEvent) => void;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);
const MAX_EVENTS = 2000;

const INITIAL_SESSION: SessionState = {
  editorHTML: '<p></p>',
  events: [],
};

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<SessionState>(INITIAL_SESSION);

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

  const value = useMemo(
    () => ({
      session,
      setEditorHTML,
      appendEvent,
      clearSession,
    }),
    [session, setEditorHTML, appendEvent, clearSession]
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
