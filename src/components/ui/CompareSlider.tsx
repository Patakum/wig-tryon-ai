'use client';

import { useState, useEffect } from 'react';
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider';
import { Skeleton } from './skeleton';

type CompareSliderProps = {
  beforeUrl: string;
  afterUrl: string;
};

export default function CompareSlider({
  beforeUrl,
  afterUrl,
}: CompareSliderProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted((prev) => !prev), []);

  if (!mounted) return <Skeleton className="h-100 w-full rounded-xl" />;

  return (
    <ReactCompareSlider
      className="rounded-xl overflow-hidden w-full"
      itemOne={<ReactCompareSliderImage src={beforeUrl} alt="Before" />}
      itemTwo={<ReactCompareSliderImage src={afterUrl} alt="After" />}
    />
  );
}
