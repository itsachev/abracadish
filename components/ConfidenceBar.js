export default function ConfidenceBar({ label, value }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-foreground/80">{label}</span>
        <span className="font-mono font-medium text-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/8">
        <div
          className="gradient-accent h-1.5 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
