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
      <span className="block h-7 w-0.5 animate-pulse bg-brand-500 shadow-lg" />
    </div>
  );
};

export default PlaybackCursor;
