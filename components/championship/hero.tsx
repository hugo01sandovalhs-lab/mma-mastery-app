import { cn } from "cn";

export function ChampionshipHero({
  eyebrow,
  headline,
  children,
  className,
  imageSrc,
  imageAlt,
}: {
  eyebrow?: string;
  headline: string;
  children?: React.ReactNode;
  className?: string;
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate flex min-h-[170px] flex-col justify-end overflow-hidden rounded-2xl bg-[oklch(0.14_0_0)] p-5 sm:min-h-[190px] sm:p-6 md:min-h-[210px] md:p-7",
        className
      )}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={imageAlt ?? ""}
          className="absolute inset-0 h-full w-full object-cover object-[center_25%] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000"
        />
      ) : (
        <>
          {/* cage-fence bokeh texture */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <pattern id="cage-fence" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="34" stroke="oklch(0.7 0.02 80)" strokeWidth="1" />
                <line x1="0" y1="0" x2="34" y2="0" stroke="oklch(0.7 0.02 80)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cage-fence)" />
          </svg>

          {/* fighter silhouette, anchored right */}
          <svg
            className="pointer-events-none absolute -right-6 bottom-0 h-full w-auto opacity-90 sm:right-0 md:opacity-100"
            viewBox="0 0 260 320"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="fighter-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.32 0.01 60)" />
                <stop offset="100%" stopColor="oklch(0.1 0 0)" />
              </linearGradient>
              <linearGradient id="fighter-rim" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="oklch(0.78 0.13 82)" stopOpacity="0" />
                <stop offset="100%" stopColor="oklch(0.78 0.13 82)" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            <path
              d="M150 34c14 0 25 12 25 27 0 11-6 20-15 25 20 8 33 21 38 44l14 92c2 10-5 20-15 21l-10 1v40c0 8-6 14-14 14h-16c-8 0-14-6-14-14v-38h-12v38c0 8-6 14-14 14H101c-8 0-14-6-14-14v-42l-9-1c-10-1-17-11-15-21l14-92c5-24 19-37 40-45-10-5-16-14-16-25 0-15 11-27 25-27z"
              fill="url(#fighter-fill)"
            />
            <path
              d="M150 34c14 0 25 12 25 27 0 11-6 20-15 25 20 8 33 21 38 44l14 92c2 10-5 20-15 21l-10 1v40c0 8-6 14-14 14h-16c-8 0-14-6-14-14v-38h-12v38c0 8-6 14-14 14H101c-8 0-14-6-14-14v-42l-9-1c-10-1-17-11-15-21l14-92c5-24 19-37 40-45-10-5-16-14-16-25 0-15 11-27 25-27z"
              stroke="url(#fighter-rim)"
              strokeWidth="2"
            />
          </svg>
        </>
      )}

      {/* readability gradients */}
      <div
        className="pointer-events-none absolute inset-0"
        style={
          imageSrc
            ? {
                background:
                  "linear-gradient(90deg, oklch(0.08 0 0) 0%, oklch(0.08 0 0 / 0.92) 38%, oklch(0.08 0 0 / 0.55) 65%, oklch(0.08 0 0 / 0.25) 100%), linear-gradient(0deg, oklch(0.06 0 0 / 0.85) 0%, oklch(0.06 0 0 / 0.35) 40%, transparent 70%)",
              }
            : {
                background:
                  "linear-gradient(90deg, oklch(0.1 0 0) 0%, oklch(0.1 0 0 / 0.85) 32%, transparent 68%), radial-gradient(120% 100% at 100% 0%, oklch(0.3 0.02 80 / 0.35), transparent 60%), linear-gradient(0deg, oklch(0.1 0 0 / 0.6), transparent 45%)",
              }
        }
      />

      <div className="relative flex flex-col gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 motion-safe:duration-700">
        {eyebrow ? (
          <span className="w-fit rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="max-w-lg text-xl font-black uppercase leading-[0.98] tracking-tight text-[oklch(0.78_0.13_82)] sm:text-2xl md:text-3xl">
          {headline}
        </h2>
        {children}
      </div>
    </div>
  );
}
