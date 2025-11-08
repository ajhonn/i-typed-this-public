type PlaybackCursorProps = {
  top: number;
  left: number;
};

const PlaybackCursor = ({ top, left }: PlaybackCursorProps) => {
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none"
      style={{ top, left }}
    >
      <span className="block h-6 w-0.5 animate-pulse bg-slate-50" />
    </div>
  );
};

export default PlaybackCursor;
