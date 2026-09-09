export default function LikertInput({ value, onChange, min = 1, max = 10 }) {
  const options = [];
  for (let i = min; i <= max; i++) options.push(i);
  return (
    <div>
      <div className="likert">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            className={value === n ? "selected" : ""}
            onClick={() => onChange(n)}
            aria-pressed={value === n}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="likert-scale-labels">
        <span>Totalmente en desacuerdo</span>
        <span>Totalmente de acuerdo</span>
      </div>
    </div>
  );
}
