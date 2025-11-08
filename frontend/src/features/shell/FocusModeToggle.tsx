type FocusModeToggleProps = {
  enabled: boolean;
  onToggle: () => void;
};

const FocusModeToggle = ({ enabled, onToggle }: FocusModeToggleProps) => {
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition hover:bg-slate-900 ${
        enabled ? 'border-emerald-400 text-emerald-300' : 'border-slate-700 text-slate-300'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} aria-hidden />
      {enabled ? 'Focus mode on' : 'Focus mode off'}
    </button>
  );
};

export default FocusModeToggle;
