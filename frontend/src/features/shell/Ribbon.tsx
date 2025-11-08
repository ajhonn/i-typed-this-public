import { NavLink } from 'react-router';
import { SHELL_TABS, type ShellTabKey } from './constants';
import SessionStatus from './SessionStatus';
import WriterToolbar from '@features/write/WriterToolbar';
import { useWriterEditorContext } from '@features/write/WriterEditorContext';

type RibbonProps = {
  activeTab: ShellTabKey;
};

const Ribbon = ({ activeTab }: RibbonProps) => {
  const sessionState = activeTab === 'write' ? 'idle' : 'reviewing';
  const writerEditor = useWriterEditorContext();

  return (
    <div className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">i-typed-this</p>
              <p className="text-xs text-slate-500">MVP shell · routing prototype</p>
            </div>
            <nav aria-label="Primary" className="flex gap-2">
              {SHELL_TABS.map((tab) => (
                <NavLink
                  key={tab.key}
                  to={tab.path}
                  className={({ isActive }) =>
                    [
                      'rounded-full px-4 py-1.5 text-sm font-medium transition',
                      isActive ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100',
                    ].join(' ')
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <SessionStatus state={sessionState} />
        </div>
        {activeTab === 'write' && writerEditor ? <WriterToolbar /> : null}
      </div>
    </div>
  );
};

export default Ribbon;
