import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useSession } from '@features/session/SessionProvider';
import { useSessionArchiveTransfer } from '@features/session/useSessionArchiveTransfer';

const PlaybackUploadPrompt = () => {
  const { session } = useSession();
  const { uploadArchive, isUploadingArchive, transferNote } = useSessionArchiveTransfer();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const hasSessionEvents = session.events.length > 0;
  const handleSelectClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try {
        await uploadArchive(file);
      } catch {
        // errors are surfaced through transferNote
      }
    },
    [uploadArchive]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragActive(false);
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      try {
        await uploadArchive(file);
      } catch {
        // surfaced via transfer note
      }
    },
    [uploadArchive]
  );

  if (hasSessionEvents) {
    return null;
  }

  return (
    <section
      className={[
        'flex flex-col gap-4 rounded-3xl border-2 border-dashed p-6 text-center shadow-sm transition',
        isDragActive ? 'border-emerald-400 bg-emerald-50/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-slate-300 bg-white/90',
      ].join(' ')}
      data-testid="playback-upload-prompt"
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">No session loaded</p>
        <h2 className="text-2xl font-semibold text-slate-900">Upload a signed session archive</h2>
        <p className="text-sm text-slate-600">
          Ask the writer to share the `.zip` they downloaded from the Write screen, then choose it here to replay every keystroke at{' '}
          <a
            className="font-semibold text-slate-900 underline decoration-dotted decoration-slate-400 hover:text-emerald-600"
            href="https://i-typed-this.com/playback"
            rel="noreferrer"
            target="_blank"
          >
            i-typed-this.com/playback
          </a>
          .
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <p className="text-sm font-medium text-slate-600">
          Drag & drop a `.zip` file here or select one from your computer.
        </p>
        <button
          type="button"
          onClick={handleSelectClick}
          disabled={isUploadingArchive}
          className="inline-flex items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploadingArchive ? 'Verifying…' : 'Select session zip'}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Need a sample? Open the Write tab, capture a quick draft, then download the archive with the built-in README.
      </p>
      {transferNote ? (
        <p
          className={`text-xs font-semibold ${transferNote.status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}
          aria-live="polite"
        >
          {transferNote.message}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept=".zip,application/zip"
        onChange={handleInputChange}
      />
    </section>
  );
};

export default PlaybackUploadPrompt;
