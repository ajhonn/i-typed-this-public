import { type ReactNode, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { SHELL_TABS, type ShellTabKey } from './constants';
import SessionStatus from './SessionStatus';
import WriterToolbar from '@features/write/WriterToolbar';
import { useWriterEditorContext } from '@features/write/WriterEditorContext';
import PlaybackToolbar from '@features/playback/PlaybackToolbar';
import { useSession } from '@features/session/SessionProvider';

type RibbonProps = {
  activeTab: ShellTabKey;
  endSlot?: ReactNode;
};

const Ribbon = ({ activeTab, endSlot }: RibbonProps) => {
  const { recorderState } = useSession();
  const sessionState = activeTab === 'playback' || activeTab === 'analysis' ? 'reviewing' : recorderState;
  const writerEditor = useWriterEditorContext();

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">i-typed-this</p>
              <p className="text-[11px] text-slate-500">MVP shell · routing prototype</p>
            </div>
            <nav aria-label="Primary" className="flex gap-1.5">
              {SHELL_TABS.map((tab) => (
                <NavLink
                  key={tab.key}
                  to={tab.path}
                  className={({ isActive }) =>
                    [
                      'rounded-full px-3 py-1 text-sm font-medium transition',
                      isActive ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100',
                    ].join(' ')
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <SessionStatus state={sessionState} />
            {endSlot}
          </div>
        </div>
        {activeTab === 'write' ? <WriterWarningPill /> : null}
        {activeTab === 'write' && writerEditor ? (
          <div className="pt-1">
            <WriterToolbar />
          </div>
        ) : null}
        {activeTab === 'playback' ? (
          <div className="pt-1">
            <PlaybackToolbar />
          </div>
        ) : null}
      </div>
    </div>
  );
};

const WriterWarningPill = () => {
  const [snippet, setSnippet] = useState<string | null>(null);
  const warningTimeout = useRef<number | null>(null);

  useEffect(() => {
    const handleWarning = (event: Event) => {
      const detail = (event as CustomEvent<{ snippet?: string }>).detail;
      setSnippet(detail?.snippet ?? null);
      if (warningTimeout.current) {
        window.clearTimeout(warningTimeout.current);
      }
      warningTimeout.current = window.setTimeout(() => setSnippet(null), 5000);
    };
    window.addEventListener('writer-unmatched-paste', handleWarning as EventListener);
    return () => {
      if (warningTimeout.current) {
        window.clearTimeout(warningTimeout.current);
      }
      window.removeEventListener('writer-unmatched-paste', handleWarning as EventListener);
    };
  }, []);

  if (!snippet) return null;

  return (
    <div className="flex w-full justify-end">
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm">
        <span aria-hidden>⚠️</span>
        Friendly heads-up: unmatched paste formatted · &quot;{snippet.slice(0, 80)}&quot;
      </span>
    </div>
  );
};

export default Ribbon;
