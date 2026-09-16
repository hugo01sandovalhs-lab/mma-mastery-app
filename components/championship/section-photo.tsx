import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

export function ChampionshipSectionPhoto({
  src,
  alt,
  label,
  icon: Icon,
  objectPosition = "center",
  className,
}: {
  src: string;
  alt: string;
  label: string;
  icon: LucideIcon;
  objectPosition?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative isolate h-28 w-full overflow-hidden rounded-2xl sm:h-36", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(0deg, oklch(0.06 0 0 / 0.9) 0%, oklch(0.06 0 0 / 0.35) 55%, transparent 100%)",
        }}
      />
      <div className="relative flex h-full items-end gap-2 p-3 sm:p-4">
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="font-heading text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">
          {label}
        </span>
      </div>
    </div>
  );
}
