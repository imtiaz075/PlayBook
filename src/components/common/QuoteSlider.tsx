import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, RotateCw, Quote as QuoteIcon } from 'lucide-react';
import { QUOTES_COLLECTION, Quote, getRandomQuoteIndex } from '../../data/quotes';

interface QuoteSliderProps {
  autoRotateIntervalMs?: number; // defaults to 60000 (60 seconds)
  extraBadge?: React.ReactNode;
}

export const QuoteSlider: React.FC<QuoteSliderProps> = ({
  autoRotateIntervalMs = 60000, // 60 seconds
  extraBadge,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayQuote, setDisplayQuote] = useState<Quote>(QUOTES_COLLECTION[0]);
  const [progressPct, setProgressPct] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detect prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }
  }, []);

  // Transition helper function
  const triggerTransition = useCallback(
    (targetIndex: number, navDirection: 'next' | 'prev') => {
      if (isTransitioning) return;

      const targetQuote = QUOTES_COLLECTION[targetIndex];
      setDirection(navDirection);

      if (prefersReducedMotion) {
        // Skip animation for reduced motion accessibility
        setCurrentIndex(targetIndex);
        setDisplayQuote(targetQuote);
        setProgressPct(0);
        return;
      }

      setIsTransitioning(true);

      // Halfway through, update displayed quote
      setTimeout(() => {
        setCurrentIndex(targetIndex);
        setDisplayQuote(targetQuote);
      }, 250);

      // Finish transition after full 500ms
      setTimeout(() => {
        setIsTransitioning(false);
        setProgressPct(0);
      }, 500);
    },
    [isTransitioning, prefersReducedMotion]
  );

  const handleNext = useCallback(() => {
    const nextIdx = getRandomQuoteIndex(currentIndex, QUOTES_COLLECTION.length);
    triggerTransition(nextIdx, 'next');
  }, [currentIndex, triggerTransition]);

  const handlePrev = useCallback(() => {
    let prevIdx = (currentIndex - 1 + QUOTES_COLLECTION.length) % QUOTES_COLLECTION.length;
    if (prevIdx === currentIndex) {
      prevIdx = (currentIndex + 1) % QUOTES_COLLECTION.length;
    }
    triggerTransition(prevIdx, 'prev');
  }, [currentIndex, triggerTransition]);

  // Reset 60-second auto-rotate timer and progress bar
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setProgressPct(0);
    const startTime = Date.now();

    // Smooth progress bar indicator tick every 200ms
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / autoRotateIntervalMs) * 100);
      setProgressPct(pct);
    }, 200);

    // Auto-advance timer every 60 seconds
    timerRef.current = setInterval(() => {
      handleNext();
    }, autoRotateIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, autoRotateIntervalMs, handleNext]);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate CSS slide classes based on direction and transition state
  const getSlideClass = () => {
    if (prefersReducedMotion) return 'opacity-100 translate-x-0';
    if (!isTransitioning) return 'opacity-100 translate-x-0 transition-all duration-500 ease-out';

    if (direction === 'next') {
      return '-translate-x-12 opacity-0 transition-all duration-250 ease-in';
    } else {
      return 'translate-x-12 opacity-0 transition-all duration-250 ease-in';
    }
  };

  return (
    <div className="relative p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md border border-slate-800 overflow-hidden group">
      {/* Background ambient glow decor */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar inside card */}
      <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold tracking-wide">
          <Sparkles size={14} className="text-amber-400 shrink-0" />
          <span>{formattedDate}</span>
          <span className="text-slate-600">·</span>
          <span className="capitalize px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 text-[10px] font-bold">
            {displayQuote.category}
          </span>
        </div>

        {/* Manual controls & Auto-rotation indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 mr-2 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50"
            title="Quote automatically refreshes every 60 seconds"
          >
            <RotateCw size={10} className="animate-spin text-indigo-400" />
            <span>60s Auto-Rotate</span>
          </div>

          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Previous Quote"
            aria-label="Previous Quote"
          >
            <ChevronLeft size={15} />
          </button>

          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Next Quote"
            aria-label="Next Quote"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 min-h-[90px]">
        {/* Animated Quote & Author Unit */}
        <div className="flex-1 min-w-0 pr-2 overflow-hidden">
          <div className={`transform ${getSlideClass()}`}>
            <div className="flex items-start gap-2">
              <QuoteIcon size={20} className="text-indigo-400 shrink-0 mt-1 opacity-70" />
              <div>
                <blockquote className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                  "{displayQuote.text}"
                </blockquote>
                <p className="text-xs font-medium text-indigo-300 mt-1.5 flex items-center gap-1">
                  <span>—</span>
                  <span className="font-semibold">{displayQuote.author || 'Unknown'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Extra Badge / Achievements Slot */}
        {extraBadge && <div className="shrink-0">{extraBadge}</div>}
      </div>

      {/* Subtle Auto-Advance Progress Line at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/60 overflow-hidden">
        <div
          style={{ width: `${progressPct}%` }}
          className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-200 ease-linear opacity-80"
        />
      </div>
    </div>
  );
};
