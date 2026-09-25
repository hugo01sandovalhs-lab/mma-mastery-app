"use client";

import { cn } from "cn";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { PHOTO_STORIES, type PhotoStoryPage } from "@/lib/design/photography";
import { useI18n } from "@/components/i18n-provider";

export function ChampionshipSectionPhoto({
  src,
  alt,
  label,
  labelKey,
  icon,
  objectPosition = "center",
  className,
  size = "default",
  priority = false,
}: {
  src: string;
  alt: string;
  label: string;
  labelKey?: string;
  /** Pass a rendered element (e.g. `<Timer />`), never a component reference: this is a
   * client component, and passing a bare function/component from a server page as a prop
   * crashes with "Functions cannot be passed directly to Client Components". */
  icon: ReactNode;
  objectPosition?: string;
  className?: string;
  size?: "default" | "large";
  priority?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className={cn("relative isolate h-28 w-full overflow-hidden rounded-2xl sm:h-36", size === "large" && "h-56 sm:h-80", className)}>
      <ProgressiveImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 767px) 100vw, 65vw"
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
        {icon}
        <span className="font-heading text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">
          {labelKey ? t(labelKey, label) : label}
        </span>
      </div>
    </div>
  );
}

export function ChampionshipPhotoMosaic({ page, className }: { page: PhotoStoryPage; className?: string }) {
  const { t } = useI18n();
  const photos = PHOTO_STORIES[page];
  return (
    <div className={cn("editorial-photo-mosaic", className)}>
      {photos.map((photo, index) => {
        const content = <>
          <ProgressiveImage src={photo.src} alt={photo.alt} fill priority={index === 0} sizes="(max-width: 767px) 82vw, (max-width: 1100px) 42vw, 30vw" style={{ objectFit: "cover", objectPosition: photo.position }} />
          <span>{t(photo.labelKey, photo.label)}</span>
        </>;
        return "href" in photo ? (
          <Link key={photo.src} href={photo.href} className="editorial-photo-tile" style={{ "--photo-order": index } as React.CSSProperties}>{content}</Link>
        ) : (
          <figure key={photo.src} className="editorial-photo-tile" style={{ "--photo-order": index } as React.CSSProperties}>{content}</figure>
        );
      })}
    </div>
  );
}
