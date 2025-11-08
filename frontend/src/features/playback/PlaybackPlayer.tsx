import { useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import PlaybackCursor from './PlaybackCursor';
import { usePlaybackController } from './PlaybackControllerContext';

const PlaybackPlayer = () => {
  const { playbackEvents, currentTime } = usePlaybackController();
  const initialContent = useMemo(() => playbackEvents[0]?.html ?? '<p></p>', [playbackEvents]);
  const editor = useEditor(
    {
      extensions: [StarterKit],
      content: initialContent,
      editable: false,
    },
    [initialContent]
  );
  const [cursorCoords, setCursorCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!editor) return;
    const currentIndex = playbackEvents.findIndex((event) => event.elapsedMs >= currentTime);
    const snapshot = playbackEvents[currentIndex] ?? playbackEvents[playbackEvents.length - 1];
    const html = snapshot?.html ?? '<p></p>';
    editor.commands.setContent(html, false);

    const selection = snapshot?.selection ?? { from: 0, to: 0 };
    const clampedSelection = {
      from: Math.max(0, Math.min(selection.from, editor.state.doc.content.size)),
      to: Math.max(0, Math.min(selection.to, editor.state.doc.content.size)),
    };
    editor.chain().setTextSelection(clampedSelection).run();

    let editorEl: HTMLElement | null = null;
    try {
      editorEl = editor.view.dom as HTMLElement | null;
    } catch {
      return;
    }
    if (!editorEl) {
      return;
    }

    const root = editorEl.closest('.playback-frame') as HTMLElement | null;
    setCursorCoords(null);
    const coords = editor.view.coordsAtPos(clampedSelection.from);
    if (root) {
      const rootRect = root.getBoundingClientRect();
      const top = coords.top - rootRect.top + root.scrollTop;
      const left = coords.left - rootRect.left + root.scrollLeft;
      setCursorCoords({ top, left });
    }

    if (typeof window !== 'undefined') {
      const viewportHeight = window.innerHeight || root?.clientHeight || 0;
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const documentTop = coords.top + scrollTop;
      const margin = 96;
      if (documentTop < scrollTop + margin) {
        window.scrollTo(0, Math.max(documentTop - margin, 0));
      } else if (documentTop > scrollTop + viewportHeight - margin) {
        const target = Math.max(documentTop - viewportHeight + margin, 0);
        window.scrollTo(0, target);
      }
    }
  }, [editor, currentTime, playbackEvents]);

  if (!editor) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading playback…
      </div>
    );
  }

  return (
    <div className="writer-editor" data-testid="playback-editor">
      <div className="playback-frame relative">
        <EditorContent editor={editor} />
        {cursorCoords ? <PlaybackCursor top={cursorCoords.top} left={cursorCoords.left} /> : null}
      </div>
    </div>
  );
};

export default PlaybackPlayer;
