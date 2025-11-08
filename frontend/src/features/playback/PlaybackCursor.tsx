type PlaybackCursorProps = {
  selection: {
    from: number;
    to: number;
  };
};

const PlaybackCursor = ({ selection }: PlaybackCursorProps) => {
  // Placeholder component until we hook into ProseMirror decorations.
  return (
    <div className="text-xs text-slate-500">
      Selection from {selection.from} to {selection.to}
    </div>
  );
};

export default PlaybackCursor;
