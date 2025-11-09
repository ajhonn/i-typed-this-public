import ShellLayout from '@features/shell/ShellLayout';
import PlaybackPlayer from './PlaybackPlayer';
import { PlaybackProvider } from './PlaybackControllerContext';

const PlaybackRoute = () => {
  return (
    <PlaybackProvider>
      <ShellLayout
        activeTab="playback"
        title="Inspect authentic sessions"
        description="Reconstruct text, timeline segments, and anomaly callouts to evaluate how work unfolded."
        showHeader={false}
      >
        <div className="flex flex-col gap-8 pb-96">
          <PlaybackPlayer />
        </div>
      </ShellLayout>
    </PlaybackProvider>
  );
};

export default PlaybackRoute;
