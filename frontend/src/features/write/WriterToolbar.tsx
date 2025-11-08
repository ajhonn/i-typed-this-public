import { useMemo } from 'react';
import { UndoRedoButton } from '@features/components/tiptap-ui/undo-redo-button';
import { HeadingDropdownMenu } from '@features/components/tiptap-ui/heading-dropdown-menu';
import { ListDropdownMenu } from '@features/components/tiptap-ui/list-dropdown-menu';
import { MarkButton } from '@features/components/tiptap-ui/mark-button';
import { ColorHighlightPopover } from '@features/components/tiptap-ui/color-highlight-popover';
import { LinkPopover } from '@features/components/tiptap-ui/link-popover';
import { TextAlignButton } from '@features/components/tiptap-ui/text-align-button';
import { useWriterEditorContext } from './WriterEditorContext';

const WriterToolbar = () => {
  const editor = useWriterEditorContext();

  const disabled = useMemo(() => !editor, [editor]);

  return (
    <div className="writer-toolbar" aria-label="Formatting toolbar">
      <div className="writer-toolbar-group">
        <UndoRedoButton editor={editor} action="undo" disabled={disabled} />
        <UndoRedoButton editor={editor} action="redo" disabled={disabled} />
      </div>

      <div className="writer-toolbar-group">
        <HeadingDropdownMenu editor={editor} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu editor={editor} />
      </div>

      <div className="writer-toolbar-group">
        <MarkButton editor={editor} type="bold" />
        <MarkButton editor={editor} type="italic" />
        <MarkButton editor={editor} type="underline" />
        <MarkButton editor={editor} type="strike" />
        <MarkButton editor={editor} type="code" />
        <ColorHighlightPopover editor={editor} />
        <LinkPopover editor={editor} />
      </div>

      <div className="writer-toolbar-group">
        <MarkButton editor={editor} type="superscript" />
        <MarkButton editor={editor} type="subscript" />
      </div>

      <div className="writer-toolbar-group">
        <TextAlignButton editor={editor} align="left" />
        <TextAlignButton editor={editor} align="center" />
        <TextAlignButton editor={editor} align="right" />
        <TextAlignButton editor={editor} align="justify" />
      </div>

    </div>
  );
};

export default WriterToolbar;
