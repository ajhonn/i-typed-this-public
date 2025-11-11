import { useCallback, useState } from 'react';
import { useSession } from './SessionProvider';
import { buildArchiveFilename, createSessionArchive, parseSessionArchive } from './sessionArchive';

type TransferNote = { status: 'success' | 'error'; message: string } | null;

export const useSessionArchiveTransfer = () => {
  const { session, loadSession } = useSession();
  const [transferNote, setTransferNote] = useState<TransferNote>(null);
  const [isDownloadingArchive, setIsDownloadingArchive] = useState(false);
  const [isUploadingArchive, setIsUploadingArchive] = useState(false);

  const downloadArchive = useCallback(async () => {
    try {
      setIsDownloadingArchive(true);
      const { blob, manifest } = await createSessionArchive(session);
      const filename = buildArchiveFilename(session, manifest.createdAt);
      const hasDOM = typeof document !== 'undefined';
      const url = typeof URL !== 'undefined' ? URL.createObjectURL(blob) : null;
      if (url && hasDOM) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (url) {
        URL.revokeObjectURL(url);
      }
      setTransferNote({
        status: 'success',
        message: `Archive downloaded · saved as ${filename}`,
      });
      return { filename, manifest };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to build session archive.';
      setTransferNote({ status: 'error', message });
      throw error;
    } finally {
      setIsDownloadingArchive(false);
    }
  }, [session]);

  const uploadArchive = useCallback(
    async (file: Blob) => {
      try {
        setIsUploadingArchive(true);
        const { session: importedSession, manifest } = await parseSessionArchive(file);
        loadSession(importedSession);
        setTransferNote({
          status: 'success',
          message: `Archive verified · SHA-256 ${manifest.sessionHash.slice(0, 12)}…`,
        });
        return { manifest };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to verify archive. Confirm the zip is intact.';
        setTransferNote({ status: 'error', message });
        throw error;
      } finally {
        setIsUploadingArchive(false);
      }
    },
    [loadSession]
  );

  return {
    transferNote,
    isDownloadingArchive,
    isUploadingArchive,
    downloadArchive,
    uploadArchive,
    setTransferNote,
  };
};
