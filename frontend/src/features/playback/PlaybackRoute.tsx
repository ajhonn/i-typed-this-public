import ShellLayout from '@features/shell/ShellLayout';
import PlaybackPlayer from './PlaybackPlayer';
import { PlaybackProvider } from './PlaybackControllerContext';
import PlaybackInsightsDrawer from './PlaybackInsightsDrawer';

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
        <PlaybackInsightsDrawer />
      </ShellLayout>
    </PlaybackProvider>
  );
};

export default PlaybackRoute;
