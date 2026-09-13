type MiniChartProps = {
  data: { label: string; value: number }[];
};

export function MiniChart({ data }: MiniChartProps) {
  const hasValues = data.some((entry) => entry.value > 0);
  const max = hasValues ? Math.max(...data.map((entry) => entry.value), 100) : 100;

  return (
    <div className="mini-chart">
      {data.map((entry) => (
        <div className="mini-bar" key={entry.label}>
          <span
            className={hasValues ? "" : "empty"}
            style={{ height: `${hasValues ? Math.max(20, (entry.value / max) * 100) : 8}%` }}
          />
          <small>{entry.label}</small>
        </div>
      ))}
    </div>
  );
}
