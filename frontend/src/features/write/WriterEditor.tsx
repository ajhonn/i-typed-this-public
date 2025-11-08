import { EditorContent } from '@tiptap/react';
import { useWriterEditorContext } from './WriterEditorContext';

const WriterEditor = () => {
  const editor = useWriterEditorContext();

  if (!editor) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500" data-testid="writer-editor">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="writer-editor" data-testid="writer-editor">
      <EditorContent editor={editor} role="presentation" />
    </div>
  );
};

export default WriterEditor;
