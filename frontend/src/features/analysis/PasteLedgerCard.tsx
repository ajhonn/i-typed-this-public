import { useMemo } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@routes/paths';
import { useSessionAnalysis } from './useSessionAnalysis';

const PasteLedgerCard = () => {
  const analysis = useSessionAnalysis();
  const unmatchedPastes = useMemo(() => {
    return analysis.pastes
      .filter((paste) => paste.classification === 'unmatched')
      .sort((a, b) => b.payloadLength - a.payloadLength);
  }, [analysis.pastes]);

  return (
    <section className="rounded-3xl border border-orange-200 bg-white p-6 shadow-sm" data-testid="paste-ledger-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-orange-500">Paste ledger</p>
          <p className="mt-1 text-sm text-slate-600">Scroll these alert cards to inspect each unmatched clipboard event.</p>
        </div>
        {unmatchedPastes.length ? (
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
            {unmatchedPastes.length} flagged
          </span>
        ) : null}
      </div>
      {unmatchedPastes.length ? (
        <div className="mt-4 max-h-96 space-y-4 overflow-y-auto pr-1 text-orange-900" role="list">
          {unmatchedPastes.map((paste) => {
            const ledgerAge =
              paste.ledgerMatch?.ageMs != null ? `${Math.round(paste.ledgerMatch.ageMs / 100) / 10}s earlier` : null;
            const idleSeconds = Math.round(paste.idleBeforeMs / 100) / 10;
            const timestampLabel = new Date(paste.timestamp).toLocaleTimeString();

            return (
              <article
                key={paste.id}
                className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm ring-1 ring-inset ring-orange-100"
                role="listitem"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">Unmatched paste</p>
                    <p className="text-base font-semibold text-orange-900">Suspicious payload detected</p>
                  </div>
                  <time className="text-xl font-bold text-orange-700" dateTime={new Date(paste.timestamp).toISOString()}>
                    {timestampLabel}
                  </time>
                </div>
                <pre className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-white/80 px-4 py-3 text-sm text-orange-900">
                  {paste.payloadText || 'Empty payload'}
                </pre>
                <p className="mt-3 text-sm text-orange-700">
                  {paste.payloadLength} chars · idle {idleSeconds}s before paste · clipboard unmatched
                  {ledgerAge ? ` (copied ${ledgerAge})` : ''}
                </p>
                <Link
                  className="mt-3 inline-flex items-center justify-center rounded-full border border-orange-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-orange-700 transition hover:bg-orange-100"
                  to={`${ROUTES.playback}?t=${paste.timestamp}`}
                >
                  Review in playback
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          No unmatched pastes — every clipboard event lines up with the ledger.
        </p>
      )}
    </section>
  );
};

export default PasteLedgerCard;
