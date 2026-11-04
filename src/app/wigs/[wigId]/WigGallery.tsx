'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/src/lib/utils';

type Props = {
  photos: { id: string; imageUrl: string }[];
  alt: string;
};

export default function WigGallery({ photos, alt }: Props) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  // Track which slide is mostly visible to drive the indicator dots.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || photos.length < 2) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveIndex(Number((entry.target as HTMLElement).dataset.index));
          }
        }
      },
      { root: scroller, threshold: 0.6 },
    );

    scroller.querySelectorAll('li').forEach((slide) => observer.observe(slide));

    return () => observer.disconnect();
  }, [photos.length]);

  function scrollTo(index: number) {
    const slide = scrollerRef.current?.children[index];
    slide?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }

  return (
    <div className="relative w-full">
      <ul
        ref={scrollerRef}
        className="flex w-full snap-x snap-mandatory overflow-x-auto list-none rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, index) => (
          <li
            key={photo.id}
            data-index={index}
            className="relative w-full shrink-0 snap-center bg-gray-100"
          >
            {!loaded.has(photo.id) && (
              <div
                className="absolute inset-0 animate-pulse bg-gray-200"
                aria-hidden="true"
              />
            )}
            <Image
              src={photo.imageUrl}
              alt={photos.length > 1 ? `${alt} - ${index + 1}` : alt}
              width={400}
              height={500}
              className="relative w-full h-auto object-cover"
              priority={index === 0}
              loading={index === 0 ? undefined : 'lazy'}
              unoptimized
              onLoad={() =>
                setLoaded((current) => new Set(current).add(photo.id))
              }
            />
          </li>
        ))}
      </ul>

      {photos.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`תמונה ${index + 1} מתוך ${photos.length}`}
              aria-current={index === activeIndex}
              className={cn(
                'h-2 w-2 rounded-full border border-white/80 shadow',
                index === activeIndex ? 'bg-gray-900' : 'bg-white/70',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
