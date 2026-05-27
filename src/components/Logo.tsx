import Image from 'next/image';
import Link from 'next/link';

type LogoProps = {
  size?: number;
};

export default function Logo({ size = 40 }: LogoProps) {
  return (
    <Link href="/" aria-label="Go to homepage">
      <Image
        src="/logo.png"
        alt="Racheli Wig Design"
        width={size}
        height={size}
        priority
      />
    </Link>
  );
}
