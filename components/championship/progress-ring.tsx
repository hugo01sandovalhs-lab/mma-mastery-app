import { cn } from "cn";

export function ProgressRing({
  value,
  size = 88,
  strokeWidth = 8,
  label,
  className,
  insufficientData = false,
}: {
  /** 0-100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
  /** true when there isn't enough tracked data to show a meaningful percentage */
  insufficientData?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (insufficientData ? 0 : clamped) / 100);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          strokeDasharray={insufficientData ? "3 5" : undefined}
        />
        {insufficientData ? null : (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {insufficientData ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pas encore de données
          </span>
        ) : (
          <span className="text-xl font-extrabold tracking-tight text-foreground">{clamped}%</span>
        )}
        {label && !insufficientData ? (
          <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
        ) : null}
      </div>
    </div>
  );
}
