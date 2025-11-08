import { NavLink } from 'react-router';
import { SHELL_TABS, type ShellTabKey } from './constants';
import FocusModeToggle from './FocusModeToggle';
import SessionStatus from './SessionStatus';

type RibbonProps = {
  activeTab: ShellTabKey;
  focusModeEnabled: boolean;
  onToggleFocusMode: () => void;
};

const Ribbon = ({ activeTab, focusModeEnabled, onToggleFocusMode }: RibbonProps) => {
  const sessionState = activeTab === 'write' ? 'idle' : 'reviewing';

  return (
    <div className="border-b border-slate-900 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-200">i-typed-this</p>
            <p className="text-xs text-slate-400">MVP shell · routing prototype</p>
          </div>
          <nav aria-label="Primary" className="flex gap-1">
            {SHELL_TABS.map((tab) => (
              <NavLink
                key={tab.key}
                to={tab.path}
                className={({ isActive }) =>
                  [
                    'rounded-full px-4 py-1.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100',
                  ].join(' ')
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <SessionStatus state={sessionState} />
          <FocusModeToggle enabled={focusModeEnabled} onToggle={onToggleFocusMode} />
        </div>
      </div>
    </div>
  );
};

export default Ribbon;
