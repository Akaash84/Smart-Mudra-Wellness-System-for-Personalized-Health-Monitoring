type StatCardProps = {
  label: string;
  value: string;
  subtext: string;
  tone?: "green" | "blue" | "amber" | "rose";
};

export function StatCard({ label, value, subtext, tone = "green" }: StatCardProps) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <p>{label}</p>
      <h3>{value}</h3>
      <span>{subtext}</span>
    </article>
  );
}
