'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WigImageGallery {
  id: string;
  imageUrl: string;
  angle: string | null;
}

export default function WigGallery({ images }: { images: WigImageGallery[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentImage = images[currentIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={currentImage.imageUrl}
          alt={currentImage.angle || 'Wig angle'}
          fill
          className="object-cover"
          priority
          unoptimized
        />

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className={`shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                idx === currentIndex ? 'border-gray-800' : 'border-gray-300'
              }`}
            >
              <Image
                src={img.imageUrl}
                alt={img.angle || `Thumbnail ${idx + 1}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
