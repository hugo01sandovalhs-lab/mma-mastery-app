"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState, type SyntheticEvent } from "react";
import { cn } from "cn";

/**
 * Reveals the photo with a soft opacity fade once it decodes, over a muted
 * placeholder that fills the reserved box immediately (no layout shift,
 * no abrupt pop-in). `prefers-reduced-motion` disables the transition via
 * CSS (see `.progressive-image` in globals.css) rather than skipping it in
 * JS, so this component has no branching to keep in sync with that media
 * query.
 */
export function ProgressiveImage({ alt, className, onLoad, style, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true);
      onLoad?.(event);
    },
    [onLoad],
  );

  return (
    <Image
      {...props}
      alt={alt}
      onLoad={handleLoad}
      className={cn("progressive-image", loaded && "progressive-image-loaded", className)}
      style={{ backgroundColor: "var(--muted)", ...style }}
    />
  );
}
