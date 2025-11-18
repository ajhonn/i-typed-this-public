import { useCallback, useState } from 'react';
import { useSession } from './SessionProvider';
import {
  buildArchiveFilename,
  finalizeSessionArchive,
  parseSessionArchive,
  prepareSessionArchive,
  type SessionArchiveManifest,
} from './sessionArchive';
import { registerSessionLedger, verifySessionLedger } from './sessionLedgerClient';

type TransferNote = { status: 'success' | 'error'; message: string } | null;

export const useSessionArchiveTransfer = () => {
  const { session, loadSession, setLedgerInfo } = useSession();
  const [transferNote, setTransferNote] = useState<TransferNote>(null);
  const [isDownloadingArchive, setIsDownloadingArchive] = useState(false);
  const [isUploadingArchive, setIsUploadingArchive] = useState(false);

  const downloadArchive = useCallback(async () => {
    try {
      setIsDownloadingArchive(true);
      const preparedArchive = await prepareSessionArchive(session);
      let ledgerReceipt: SessionArchiveManifest['ledgerReceipt'];

      let ledgerMessage: string | null = null;
      try {
        const { manifest } = preparedArchive;
        const ledgerRegistration = await registerSessionLedger({
          sessionId: session.sessionId,
          sessionHash: manifest.sessionHash,
          metadata: {
            archiveVersion: manifest.version,
            archiveCreatedAt: manifest.createdAt,
            eventCount: session.events.length,
          },
        });
        if (ledgerRegistration) {
          const registrationDetails = {
            receiptId: ledgerRegistration.receiptId,
            hashVersion: ledgerRegistration.hashVersion,
            firstSeenAt: ledgerRegistration.firstSeenAt,
            status: 'registered',
          } as const;
          setLedgerInfo(registrationDetails);
          ledgerReceipt = {
            receiptId: ledgerRegistration.receiptId,
            hashVersion: ledgerRegistration.hashVersion,
            registeredAt: ledgerRegistration.firstSeenAt,
          };
          ledgerMessage = `Ledger receipt ${ledgerRegistration.receiptId.slice(0, 8)}… registered`;
        }
      } catch (ledgerError) {
        const errorMessage =
          ledgerError instanceof Error ? ledgerError.message : 'Ledger registration failed.';
        setLedgerInfo({
          status: 'error',
          message: errorMessage,
        });
        ledgerMessage = `Ledger error · ${errorMessage}`;
      }

      const { blob, manifest } = await finalizeSessionArchive(preparedArchive, { ledgerReceipt });
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
      const messageParts = [`Archive downloaded · saved as ${filename}`];
      if (ledgerMessage) {
        messageParts.push(ledgerMessage);
      }
      setTransferNote({
        status: 'success',
        message: messageParts.join(' · '),
      });
      return { filename, manifest };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to build session archive.';
      setTransferNote({ status: 'error', message });
      throw error;
    } finally {
      setIsDownloadingArchive(false);
    }
  }, [session, setLedgerInfo]);

  const uploadArchive = useCallback(
    async (file: Blob) => {
      try {
        setIsUploadingArchive(true);
        const { session: importedSession, manifest } = await parseSessionArchive(file);
        loadSession(importedSession);
        if (manifest.ledgerReceipt) {
          setLedgerInfo({
            receiptId: manifest.ledgerReceipt.receiptId,
            hashVersion: manifest.ledgerReceipt.hashVersion,
            firstSeenAt: manifest.ledgerReceipt.registeredAt,
            status: 'registered',
          });
        }
        let ledgerStatus: string | null = null;
        const ledgerReceiptId =
          manifest.ledgerReceipt?.receiptId ?? importedSession.ledger?.receiptId;
        if (ledgerReceiptId) {
          try {
            const verification = await verifySessionLedger({
              receiptId: ledgerReceiptId,
              sessionId: importedSession.sessionId,
              sessionHash: manifest.sessionHash,
            });
            if (verification) {
              setLedgerInfo({
                receiptId: verification.receiptId ?? ledgerReceiptId,
                firstSeenAt: verification.firstSeenAt ?? importedSession.ledger?.firstSeenAt,
                lastVerifiedAt: new Date().toISOString(),
                status: verification.status,
              });
              ledgerStatus = `Ledger ${verification.status}`;
            }
          } catch (ledgerError) {
            const errorMessage =
              ledgerError instanceof Error ? ledgerError.message : 'Ledger verification failed.';
            setLedgerInfo({
              receiptId: ledgerReceiptId,
              status: 'error',
              message: errorMessage,
            });
            ledgerStatus = `Ledger error · ${errorMessage}`;
          }
        }
        const uploadMessage = [`Archive verified · SHA-256 ${manifest.sessionHash.slice(0, 12)}…`];
        if (ledgerStatus) {
          uploadMessage.push(ledgerStatus);
        }
        setTransferNote({
          status: 'success',
          message: uploadMessage.join(' · '),
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
    [loadSession, setLedgerInfo]
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
