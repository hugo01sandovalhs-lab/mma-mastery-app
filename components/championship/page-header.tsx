import Image from "next/image";
import { PAGE_PHOTOS, type PhotoPage } from "@/lib/design/photography";

export function PageHeader({ page, title, description, actions }: {
  page: Exclude<PhotoPage, "dashboard">;
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const photo = PAGE_PHOTOS[page];
  return (
    <header className={`editorial-header editorial-header--${page}`}>
      <div className="editorial-header-copy">
        <h1>{title}</h1>
        <div className="editorial-header-description">{description}</div>
        {actions && <div className="editorial-header-actions">{actions}</div>}
      </div>
      <div className="editorial-header-photo">
        <Image src={photo.src} alt={photo.alt} fill priority sizes="(max-width: 767px) 100vw, 55vw" style={{ objectFit: "cover", objectPosition: photo.position }} />
      </div>
    </header>
  );
}
