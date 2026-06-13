import type { RunSummary } from "@/lib/rift-api";
import { groupRunsByDay } from "@/lib/dashboard-analytics";

export function ActivityChart({ runs }: { runs: RunSummary[] }) {
  const data = groupRunsByDay(runs);
  const max = Math.max(...data.map((d) => d.count), 1);
  const width = 560;
  const height = 160;
  const pad = 8;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (width - pad * 2);
    const y = height - pad - (d.count / max) * (height - pad * 2);
    return { x, y, ...d };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${points[0]?.x ?? 0},${height - pad} ${line} ${points[points.length - 1]?.x ?? 0},${height - pad}`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#activityFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="#000"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="3" fill="#000" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-[var(--muted-light)]">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}
