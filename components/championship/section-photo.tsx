import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { PHOTO_STORIES, type PhotoStoryPage } from "@/lib/design/photography";

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
      <Image
        src={src}
        alt={alt}
        fill
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
        <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="font-heading text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">
          {label}
        </span>
      </div>
    </div>
  );
}

export function ChampionshipPhotoMosaic({ page, className }: { page: PhotoStoryPage; className?: string }) {
  const photos = PHOTO_STORIES[page];
  return (
    <div className={cn("editorial-photo-mosaic", className)}>
      {photos.map((photo, index) => {
        const content = <>
          <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 767px) 82vw, (max-width: 1100px) 42vw, 30vw" style={{ objectFit: "cover", objectPosition: photo.position }} />
          <span>{photo.label}</span>
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
