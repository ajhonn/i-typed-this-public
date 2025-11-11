import { useCallback, useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@features/components/tiptap-ui-primitive/tooltip/tooltip';
import { useWriterEditorContext } from './WriterEditorContext';

const TOOLTIP_MESSAGE = 'When the writing is finished, copy to Word/Docs for adding images, formatting and export to PDF';

const CopyAllButton = () => {
  const editor = useWriterEditorContext();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const scheduleReset = useCallback(() => {
    const requestFrame = typeof window === 'undefined' ? null : window;
    const timer = requestFrame?.setTimeout ?? setTimeout;
    timer(() => setCopied(false), 2500);
  }, []);

  const scheduleErrorClear = useCallback(() => {
    const requestFrame = typeof window === 'undefined' ? null : window;
    const timer = requestFrame?.setTimeout ?? setTimeout;
    timer(() => setCopyError(null), 4000);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!editor) return;

    const html = editor.getHTML();
    const text = editor.getText();

    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        'write' in navigator.clipboard &&
        typeof ClipboardItem !== 'undefined'
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ]);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } else {
        throw new Error('Clipboard API not available');
      }

      setCopied(true);
      setCopyError(null);
      scheduleReset();
    } catch (error) {
      console.error('Failed to copy writer contents', error);
      setCopyError('Copy failed. Please select all and copy manually.');
      setCopied(false);
      scheduleErrorClear();
    }
  }, [editor, scheduleReset, scheduleErrorClear]);

  const statusLabel = useMemo(() => {
    if (copied) return 'Copied!';
    if (copyError) return 'Try again';
    return 'Copy All';
  }, [copied, copyError]);

  const Icon = copied ? Check : Copy;

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!editor}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {statusLabel}
            <span className="sr-only">Copy your entire draft.</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>{TOOLTIP_MESSAGE}</TooltipContent>
      </Tooltip>
      <span aria-live="polite" className="text-xs text-rose-600">
        {copyError}
      </span>
    </div>
  );
};

export default CopyAllButton;
