'use client';

import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from 'react-compare-slider';

type CompareSliderProps = {
  beforeUrl: string;
  afterUrl: string;
};

export default function CompareSlider({ beforeUrl, afterUrl }: CompareSliderProps) {
  return (
    <ReactCompareSlider
      className="rounded-xl overflow-hidden w-full"
      itemOne={
        <ReactCompareSliderImage src={beforeUrl} alt="Before" />
      }
      itemTwo={
        <ReactCompareSliderImage src={afterUrl} alt="After" />
      }
    />
  );
}
