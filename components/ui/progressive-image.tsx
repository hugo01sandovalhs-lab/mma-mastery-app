import Image, { type ImageProps } from "next/image";

export function ProgressiveImage({ alt, ...props }: ImageProps) {
  return <Image {...props} alt={alt} />;
}
