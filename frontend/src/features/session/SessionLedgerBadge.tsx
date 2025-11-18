import type { SessionLedgerInfo } from './SessionProvider';
import { useSession } from './SessionProvider';

const STATUS_COPY: Record<NonNullable<SessionLedgerInfo['status']>, { label: string; tone: string }> = {
  registered: { label: 'Ledger receipt stored', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  verified: { label: 'Ledger verified', tone: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  mismatch: { label: 'Ledger mismatch', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  unknown: { label: 'Ledger unknown', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  error: { label: 'Ledger error', tone: 'bg-rose-50 text-rose-700 border-rose-300' },
};

const SessionLedgerBadge = () => {
  const { session } = useSession();
  const ledger = session.ledger;
  if (!ledger?.status) {
    return null;
  }
  const copy = STATUS_COPY[ledger.status];
  if (!copy) {
    return null;
  }

  const helper = ledger.receiptId ? ` · ${ledger.receiptId.slice(0, 8)}…` : '';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide',
        copy.tone,
      ].join(' ')}
      title={ledger.message ?? undefined}
    >
      {copy.label}
      {helper}
    </span>
  );
};

export default SessionLedgerBadge;
