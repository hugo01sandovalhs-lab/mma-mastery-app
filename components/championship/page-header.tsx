"use client";

import { ProgressiveImage } from "@/components/ui/progressive-image";
import { PAGE_PHOTOS, type PhotoPage } from "@/lib/design/photography";
import { useI18n } from "@/components/i18n-provider";

export function PageHeader({ page, title, description, actions }: {
  page: Exclude<PhotoPage, "dashboard">;
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const photo = PAGE_PHOTOS[page];
  const { t } = useI18n();
  const localizedTitle = page === "calendar" ? title : t(`page.${page}.title`, title);
  return (
    <header className={`editorial-header editorial-header--${page}`}>
      <div className="editorial-header-copy">
        <h1>{localizedTitle}</h1>
        <div className="editorial-header-description">{description}</div>
        {actions && <div className="editorial-header-actions">{actions}</div>}
      </div>
      <div className="editorial-header-photo">
        <ProgressiveImage src={photo.src} alt={photo.alt} fill priority sizes="(max-width: 767px) 100vw, 55vw" style={{ objectFit: "cover", objectPosition: photo.position }} />
      </div>
    </header>
  );
}
