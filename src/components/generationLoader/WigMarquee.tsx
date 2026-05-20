'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

const GAP = 32; // gap-6 = 24px
const SPEED = 1; // px per frame

type WigMarqueeProps = {
  images: string[];
  direction: 'left' | 'right';
};

export default function WigMarquee({ images, direction }: WigMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.children) as HTMLElement[];
    const itemWidth = items[0]?.offsetWidth ?? 144;
    const step = itemWidth + GAP;
    const containerWidth = container.offsetWidth;
    const dir = direction === 'left' ? -1 : 1;

    const positions = items.map((_, i) =>
      direction === 'left' ? i * step : -i * step,
    );

    items.forEach((el, i) => {
      el.style.transform = `translateX(${positions[i]}px)`;
    });

    const animate = () => {
      for (let i = 0; i < items.length; i++) {
        positions[i] += dir * SPEED;

        if (dir === -1 && positions[i] + itemWidth < 0) {
          positions[i] = Math.max(...positions) + step;
        } else if (dir === 1 && positions[i] > containerWidth) {
          positions[i] = Math.min(...positions) - step;
        }

        items[i].style.transform = `translateX(${positions[i]}px)`;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [direction, images]);

  if (images.length === 0) return <Loader2 className="animate-spin" size={50}/>;

  return (
    <div ref={containerRef} className="relative w-full h-44 overflow-hidden">
      {images.map((src, i) => (
        <div
          key={i}
          className="absolute top-0 left-0 w-36 h-44 rounded-lg overflow-hidden"
          style={{ willChange: 'transform' }}
        >
          <Image
            src={src}
            alt=""
            width={180}
            height={220}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}
