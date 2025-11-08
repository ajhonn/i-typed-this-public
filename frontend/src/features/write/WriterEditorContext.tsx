import { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type { Editor } from '@tiptap/react';

const WriterEditorContext = createContext<Editor | null>(null);

export const WriterEditorProvider = ({
  editor,
  children,
}: PropsWithChildren<{ editor: Editor | null }>) => {
  return <WriterEditorContext.Provider value={editor}>{children}</WriterEditorContext.Provider>;
};

export const useWriterEditorContext = () => {
  return useContext(WriterEditorContext);
};
