import { useState } from 'react';
import SessionAnalysisPanel from '@features/analysis/SessionAnalysisPanel';
import SessionInspector from './SessionInspector';

const PlaybackInsightsDrawer = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="fixed inset-y-24 right-2 z-40 flex flex-col items-end gap-3 sm:right-4 lg:right-6">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow"
      >
        {open ? 'Hide analysis' : 'Show analysis'}
      </button>
      <div
        className={[
          'max-h-[calc(100vh-140px)] w-[94vw] max-w-[600px] overflow-y-auto rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur transition-all duration-300 ease-out sm:w-[520px]',
          open ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-10 opacity-0',
        ].join(' ')}
        aria-hidden={!open}
      >
        <div className="space-y-4">
          <SessionAnalysisPanel />
          <SessionInspector />
        </div>
      </div>
    </div>
  );
};

export default PlaybackInsightsDrawer;
