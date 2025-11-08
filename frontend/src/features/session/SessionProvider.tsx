import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

type SessionState = {
  editorHTML: string;
};

type SessionContextValue = {
  session: SessionState;
  setEditorHTML: (html: string) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const INITIAL_SESSION: SessionState = {
  editorHTML: '<p></p>',
};

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<SessionState>(INITIAL_SESSION);

  const setEditorHTML = (html: string) => {
    setSession((prev) => ({
      ...prev,
      editorHTML: html,
    }));
  };

  const value = useMemo(
    () => ({
      session,
      setEditorHTML,
    }),
    [session]
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
