import Image from 'next/image';

type ImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  unoptimized?: boolean;
  props?: React.ImgHTMLAttributes<HTMLImageElement>;
};

export default function CustomImage({
  src,
  alt,
  width = 1024,
  height = 1024,
  className = 'rounded-lg w-full h-48 object-cover',
  unoptimized = true,
  ...props
}: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-lg w-full h-48 object-cover ${className}`}
      unoptimized={unoptimized}
      fill={false}
      {...props}
    />
  );
}
