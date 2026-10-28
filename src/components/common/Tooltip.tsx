import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside on touch devices
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <div
        onClick={(e) => {
          // Toggle on touch or click
          setIsVisible((prev) => !prev);
        }}
        className="inline-flex cursor-pointer"
      >
        {children}
      </div>

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 ${positionClasses[position]} px-2.5 py-1.5 text-xs text-white bg-slate-800 rounded-md shadow-lg whitespace-normal min-w-[140px] max-w-[280px] pointer-events-none animate-in fade-in zoom-in-95 duration-150 leading-relaxed text-center font-normal`}
        >
          {content}
          <div className={`absolute border-4 w-0 h-0 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
};

interface InfoTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  position = 'top',
  size = 14,
  className = '',
  ariaLabel = 'More information',
}) => {
  return (
    <Tooltip content={content} position={position} className={className}>
      <button
        type="button"
        aria-label={ariaLabel}
        className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-hidden rounded-full transition-colors inline-flex items-center justify-center align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <Info size={size} strokeWidth={2} />
      </button>
    </Tooltip>
  );
};
