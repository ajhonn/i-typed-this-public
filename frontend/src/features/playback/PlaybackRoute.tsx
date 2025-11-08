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
        <PlaybackPlayer />
      </ShellLayout>
    </PlaybackProvider>
  );
};

export default PlaybackRoute;
