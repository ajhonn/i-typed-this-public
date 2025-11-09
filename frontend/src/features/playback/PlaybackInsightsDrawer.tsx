import SessionAnalysisPanel from '@features/analysis/SessionAnalysisPanel';
import SessionInspector from './SessionInspector';

type PlaybackInsightsDrawerProps = {
  open: boolean;
};

const PlaybackInsightsDrawer = ({ open }: PlaybackInsightsDrawerProps) => {
  const showInspector = import.meta.env.DEV;

  return (
    <div className="pointer-events-none fixed inset-y-24 right-2 z-40 flex flex-col items-end sm:right-4 lg:right-6">
      <div
        className={[
          'pointer-events-auto max-h-[calc(100vh-140px)] w-[94vw] max-w-[600px] overflow-y-auto rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur transition-all duration-300 ease-out sm:w-[520px]',
          open ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0',
        ].join(' ')}
        data-testid="playback-insights"
        aria-hidden={!open}
      >
        <div className="space-y-4">
          <SessionAnalysisPanel />
          {showInspector ? <SessionInspector /> : null}
        </div>
      </div>
    </div>
  );
};

export default PlaybackInsightsDrawer;
