import { cn } from "cn";

export function ChampionshipHero({
  eyebrow,
  headline,
  children,
  className,
}: {
  eyebrow?: string;
  headline: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[oklch(0.16_0_0)] p-6 sm:p-8",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 100% 0%, oklch(0.3 0.02 80 / 0.5), transparent 60%)",
        }}
      />
      <div className="relative flex flex-col gap-3">
        {eyebrow ? (
          <span className="w-fit rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="max-w-md text-2xl font-black uppercase leading-tight tracking-tight text-[oklch(0.78_0.13_82)] sm:text-3xl">
          {headline}
        </h2>
        {children}
      </div>
    </div>
  );
}
