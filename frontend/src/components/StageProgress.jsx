const STAGES = [
  { id: 1, label: 'Idea' },
  { id: 2, label: 'Plan' },
  { id: 3, label: 'Budget' },
];

export default function StageProgress({ currentStage }) {
  return (
    <div className="stage-progress">
      {STAGES.map((s, i) => {
        const done = s.id < currentStage;
        const active = s.id === currentStage;
        return (
          <div className="stage-step" key={s.id}>
            <div className={`stage-dot ${active ? 'stage-dot--active' : ''} ${done ? 'stage-dot--done' : ''}`}>
              {done ? '✓' : s.id}
            </div>
            <span className={`stage-label ${active ? 'stage-label--active' : ''}`}>{s.label}</span>
            {i < STAGES.length - 1 && (
              <div className={`stage-line ${done ? 'stage-line--done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
