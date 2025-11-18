import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionProvider } from './SessionProvider';
import { useSessionArchiveTransfer } from './useSessionArchiveTransfer';

const mockPrepareSessionArchive = vi.fn();
const mockFinalizeSessionArchive = vi.fn();
const mockParseSessionArchive = vi.fn();
const mockBuildArchiveFilename = vi.fn();
const mockRegisterSessionLedger = vi.fn();
const mockVerifySessionLedger = vi.fn();

vi.mock('./sessionArchive', () => ({
  prepareSessionArchive: (...args: unknown[]) => mockPrepareSessionArchive(...args),
  finalizeSessionArchive: (...args: unknown[]) => mockFinalizeSessionArchive(...args),
  parseSessionArchive: (...args: unknown[]) => mockParseSessionArchive(...args),
  buildArchiveFilename: (...args: unknown[]) => mockBuildArchiveFilename(...args),
}));

vi.mock('./sessionLedgerClient', () => ({
  registerSessionLedger: (...args: unknown[]) => mockRegisterSessionLedger(...args),
  verifySessionLedger: (...args: unknown[]) => mockVerifySessionLedger(...args),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => <SessionProvider>{children}</SessionProvider>;

describe('useSessionArchiveTransfer', () => {
  beforeEach(() => {
    mockPrepareSessionArchive.mockReset();
    mockFinalizeSessionArchive.mockReset();
    mockParseSessionArchive.mockReset();
    mockBuildArchiveFilename.mockReset();
    mockRegisterSessionLedger.mockReset();
    mockVerifySessionLedger.mockReset();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock') as typeof globalThis.URL.createObjectURL;
    globalThis.URL.revokeObjectURL = vi.fn() as typeof globalThis.URL.revokeObjectURL;
  });

  it('registers the session hash when downloading archives', async () => {
    mockPrepareSessionArchive.mockResolvedValue({
      sessionJson: '{"sessionId":"session-abc"}',
      manifest: {
        version: '1.0.0',
        createdAt: '2025-01-01T00:00:00.000Z',
        hashAlgorithm: 'SHA-256',
        sessionHash: 'abc123',
        files: { session: 'session.json', readme: 'README.txt' },
      },
    });
    mockFinalizeSessionArchive.mockResolvedValue({
      blob: new Blob(['test']),
      manifest: {
        version: '1.0.0',
        createdAt: '2025-01-01T00:00:00.000Z',
        hashAlgorithm: 'SHA-256',
        sessionHash: 'abc123',
        files: { session: 'session.json', readme: 'README.txt' },
        ledgerReceipt: {
          receiptId: 'receipt-1234567890',
          hashVersion: 'v1',
          registeredAt: '2025-01-01T00:00:00.000Z',
        },
      },
    });
    mockBuildArchiveFilename.mockReturnValue('session.zip');
    mockRegisterSessionLedger.mockResolvedValue({
      receiptId: 'receipt-1234567890',
      sessionId: 'session-abc',
      sessionHash: 'abc123',
      hashVersion: 'v1',
      firstSeenAt: '2025-01-01T00:00:00.000Z',
    });

    const { result } = renderHook(() => useSessionArchiveTransfer(), { wrapper });
    await act(async () => {
      await result.current.downloadArchive();
    });

    expect(mockRegisterSessionLedger).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionHash: 'abc123',
      }),
    );
    expect(mockFinalizeSessionArchive).toHaveBeenCalledWith(
      expect.objectContaining({
        manifest: expect.objectContaining({ sessionHash: 'abc123' }),
      }),
      expect.objectContaining({
        ledgerReceipt: expect.objectContaining({ receiptId: 'receipt-1234567890' }),
      }),
    );
    expect(result.current.transferNote?.message).toContain('Ledger receipt');
  });

  it('verifies the session hash when uploading archives with receipts', async () => {
    mockParseSessionArchive.mockResolvedValue({
      session: {
        sessionId: 'session-upload',
        editorHTML: '<p>hello</p>',
        events: [],
      },
      manifest: {
        version: '1.0.0',
        createdAt: '2025-01-01T00:00:00.000Z',
        hashAlgorithm: 'SHA-256',
        sessionHash: 'def456',
        files: { session: 'session.json', readme: 'README.txt' },
        ledgerReceipt: {
          receiptId: 'receipt-upload',
          hashVersion: 'v1',
          registeredAt: '2025-01-01T00:00:00.000Z',
        },
      },
    });
    mockVerifySessionLedger.mockResolvedValue({
      status: 'verified',
      receiptId: 'receipt-upload',
      firstSeenAt: '2025-01-01T00:00:00.000Z',
    });

    const { result } = renderHook(() => useSessionArchiveTransfer(), { wrapper });
    const file = new Blob(['zip']);
    await act(async () => {
      await result.current.uploadArchive(file);
    });

    expect(mockVerifySessionLedger).toHaveBeenCalledWith(
      expect.objectContaining({
        receiptId: 'receipt-upload',
        sessionHash: 'def456',
      }),
    );
    expect(result.current.transferNote?.message).toContain('Ledger verified');
  });
});
