import { useMemo } from 'react';
import { useSession } from '@features/session/SessionProvider';

const formatTimestamp = (ts: number) => new Date(ts).toLocaleTimeString();

const SessionInspector = () => {
  const { session } = useSession();
  const { events, editorHTML } = session;

  const counts = useMemo(() => {
    return events.reduce<Record<string, number>>((acc, event) => {
      acc[event.type] = (acc[event.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [events]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(session, null, 2));
    } catch {
      // no-op
    }
  };

  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Session inspector</h2>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Copy JSON
        </button>
      </div>
      <dl className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Events recorded</dt>
          <dd className="text-lg font-semibold text-slate-900">{events.length}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">HTML length</dt>
          <dd className="text-lg font-semibold text-slate-900">{editorHTML.length}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Last event</dt>
          <dd className="text-base text-slate-900">
            {events.length ? `${events.at(-1)?.type} · ${formatTimestamp(events.at(-1)!.timestamp)}` : 'None yet'}
          </dd>
        </div>
      </dl>
      {events.length ? (
        <>
          <div className="grid gap-2 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-500">Breakdown</p>
            <ul className="grid gap-1">
              {Object.entries(counts).map(([type, count]) => (
                <li key={type} className="flex items-center justify-between">
                  <span className="font-medium capitalize text-slate-800">{type.replace('-', ' ')}</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          </div>
          <details className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
            <summary className="cursor-pointer text-slate-900">Raw session payload</summary>
            <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-slate-900/90 p-3 text-xs text-slate-50">
              {JSON.stringify(session, null, 2)}
            </pre>
          </details>
        </>
      ) : (
        <p className="text-sm text-slate-600">No recorder events yet. Type on the Write tab to populate this log.</p>
      )}
    </section>
  );
};

export default SessionInspector;
