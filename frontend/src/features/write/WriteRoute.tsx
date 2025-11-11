import { useEffect, useState } from 'react';
import ShellLayout from '@features/shell/ShellLayout';
import HeroModal from './HeroModal';
import WriterEditor from './WriterEditor';
import { WriterEditorProvider } from './WriterEditorContext';
import { useWriterEditor } from './useWriterEditor';
import CopyAllButton from './CopyAllButton';

const HERO_STORAGE_KEY = 'write-hero-dismissed';

const WriteRoute = () => {
  const editor = useWriterEditor();
  // console.log('WriterEditorProvider value', WriterEditorProvider);
  const [showHero, setShowHero] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.localStorage.getItem(HERO_STORAGE_KEY) !== 'true';
  });

  useEffect(() => {
    if (!showHero && typeof window !== 'undefined') {
      window.localStorage.setItem(HERO_STORAGE_KEY, 'true');
    }
  }, [showHero]);

  return (
    <WriterEditorProvider editor={editor}>
      <ShellLayout
        activeTab="write"
        title="Observe the writing journey"
        description="Replay keystrokes, verify integrity, and surface authorship signals from live writing sessions."
        showHeader={false}
        ribbonAction={<CopyAllButton />}
      >
        <WriterEditor />
        {showHero ? <HeroModal onDismiss={() => setShowHero(false)} /> : null}
      </ShellLayout>
    </WriterEditorProvider>
  );
};

export default WriteRoute;
