"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "cn";

export function ProgressiveImage({ alt, className, onLoad, style, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      alt={alt}
      className={cn(
        "opacity-0 transition-opacity duration-200 motion-reduce:transition-none",
        loaded && "opacity-100",
        className,
      )}
      style={{ ...style, opacity: loaded ? style?.opacity ?? 1 : 0 }}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
    />
  );
}
