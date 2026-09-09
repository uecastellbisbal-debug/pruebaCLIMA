const FACTOR_COLOR = {
  A: "#2563eb",
  B: "#7c3aed",
  C: "#d97706",
  D: "#059669",
};

export default function ScoreBar({ label, score, factor, max = 10 }) {
  const pct = score === null || score === undefined ? 0 : (score / max) * 100;
  const color = FACTOR_COLOR[factor] || "#0f766e";
  return (
    <div className="score-row">
      <div className="name" title={label}>
        {label}
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="score-value">{score === null || score === undefined ? "—" : score.toFixed(1)}</div>
    </div>
  );
}
