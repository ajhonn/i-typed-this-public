import { useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { Typography } from '@tiptap/extension-typography';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Selection } from '@tiptap/extensions';
import { useSession } from '@features/session/SessionProvider';
import { handleImageUpload, MAX_FILE_SIZE } from '@features/lib/tiptap-utils';
import { ImageUploadNode } from '@features/components/tiptap-node/image-upload-node/image-upload-node-extension';
import { HorizontalRule } from '@features/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension';
import '@features/components/tiptap-node/blockquote-node/blockquote-node.scss';
import '@features/components/tiptap-node/code-block-node/code-block-node.scss';
import '@features/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss';
import '@features/components/tiptap-node/list-node/list-node.scss';
import '@features/components/tiptap-node/image-node/image-node.scss';
import '@features/components/tiptap-node/heading-node/heading-node.scss';
import '@features/components/tiptap-node/paragraph-node/paragraph-node.scss';
import { useRecorder } from '@features/recorder/useRecorder';
import { PasteCaptureExtension, consumePendingUnmatchedAlert } from '@features/playback/extensions/PasteCaptureExtension';

const EDITOR_CLASS = 'simple-editor writer-editor-content';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatUnmatchedPaste = (snippet: string, editor: Editor) => {
  if (!editor) return;
  const trimmed = snippet.replace(/\s+/g, ' ').trim();
  if (!trimmed.length) return;
  const safeSnippet = escapeHtml(trimmed);
  const selection = editor.state.selection;
  const end = selection.from;
  const start = Math.max(end - snippet.length, 0);
  editor
    .chain()
    .focus()
    .setTextSelection({ from: start, to: end })
    .insertContent(`<pre class="unmatched-paste-block"><code>${safeSnippet}</code></pre>`)
    .setTextSelection({ from: start + safeSnippet.length, to: start + safeSnippet.length })
    .run();
};

export const useWriterEditor = () => {
  const { session, setEditorHTML } = useSession();

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        'aria-label': 'Main content area, start typing to enter text.',
        class: EDITOR_CLASS,
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      PasteCaptureExtension,
      HorizontalRule,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: 'image/*',
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error('Upload failed:', error),
      }),
    ],
    content: session.editorHTML || '<p></p>',
    onUpdate: ({ editor: tiptapEditor }) => {
      setEditorHTML(tiptapEditor.getHTML());
    },
  });

  useRecorder(editor);

  useEffect(() => {
    if (!editor) return;
    const currentHTML = editor.getHTML();
    if (session.editorHTML !== currentHTML) {
      editor.commands.setContent(session.editorHTML || '<p></p>', false, {
        preserveWhitespace: true,
      });
    }
  }, [editor, session.editorHTML]);

  useEffect(() => {
    if (!editor) return;
    const handleTransaction = () => {
      const alert = consumePendingUnmatchedAlert();
      if (!alert || !alert.text) return;
      formatUnmatchedPaste(alert.text, editor);
      window.dispatchEvent(
        new CustomEvent('writer-unmatched-paste', {
          detail: { snippet: alert.text.replace(/\s+/g, ' ').trim() },
        })
      );
    };
    editor.on('transaction', handleTransaction);
    return () => {
      editor.off('transaction', handleTransaction);
    };
  }, [editor]);

  return editor;
};
