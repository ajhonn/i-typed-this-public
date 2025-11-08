import { useMemo } from 'react';
import { useSession } from '@features/session/SessionProvider';
import { analyzeSession } from './analyzeSession';

export const useSessionAnalysis = () => {
  const { session } = useSession();
  return useMemo(() => analyzeSession(session.events, session.editorHTML), [session.events, session.editorHTML]);
};
