import React, { useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface MobileNumberSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function MobileNumberSelector({
  value,
  onChange,
  min = 0,
  max = 10000000,
  step = 200000,
}: MobileNumberSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const numbers = React.useMemo(() => {
    const arr = [];
    for (let i = min; i <= max; i += step) {
      arr.push(i);
    }
    return arr;
  }, [min, max, step]);

  const selectedIndex = React.useMemo(() => {
    return Math.round((value - min) / step);
  }, [value, min, step]);

  useEffect(() => {
    if (scrollRef.current && !isScrollingRef.current) {
      // Precise scroll to center with smooth behavior
      scrollRef.current.scrollTo({
        top: selectedIndex * 40,
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Prevent external value updates during scroll
    isScrollingRef.current = true;

    const scrollPosition = e.currentTarget.scrollTop;
    // Use Math.floor with offset for more precise centering
    // Add 20 to ensure accurate center calculation
    const newIndex = Math.floor((scrollPosition + 20) / 40);
    const newValue = newIndex * step + min;

    // Add a small tolerance to prevent unnecessary updates
    if (Math.abs(newValue - value) >= step / 2) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }

    // Reset scrolling flag after a short delay
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 100);
  }, [onChange, min, max, step, value]);

  return (
    <div className="relative h-[120px] overflow-hidden border rounded-md">
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-scroll scrollbar-hide"
        style={{
          paddingTop: '40px',
          paddingBottom: '40px',
          scrollSnapType: 'y mandatory'
        }}
        onScroll={handleScroll}
      >
        {numbers.map((num, index) => {
          const distance = index - selectedIndex;
          // Scale based on distance
          const scale = 1 - Math.min(Math.abs(distance) * 0.1, 0.8);
          // Optional transforms for a "wheel" effect
          const rotateX = distance * 2;
          const translateZ = (1 - scale) * -400;

          const style: React.CSSProperties = {
            transform: `perspective(500px) rotateX(${rotateX}deg) translateZ(${translateZ}px) scale(${scale})`,
            transition: 'transform 0.1s',
            scrollSnapAlign: 'center'
          };

          return (
            <div
              key={num}
              className="h-[40px] flex items-center justify-center"
              style={style}
            >
              {num.toLocaleString()}
            </div>
          );
        })}
      </div>
      {/* Highlight band at the center (40px to 80px), center line at 60px */}
      <div className="absolute inset-x-0 top-[40px] h-[40px] bg-primary/10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 flex flex-col justify-center">
        <ChevronUp className="h-4 w-4 text-gray-400" />
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}