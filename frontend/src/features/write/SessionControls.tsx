import { useSession } from '@features/session/SessionProvider';

const SessionControls = () => {
  const { session } = useSession();

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={handleDownload}
        className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Download session JSON
      </button>
    </div>
  );
};

export default SessionControls;
