'use client';

import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
}

interface FilterState {
  impactLevels: string[];
  biases: string[];
  timeRange: string;
}

const impactOptions = [
  { value: 'S', label: 'S', description: 'CRITICAL' },
  { value: 'A', label: 'A', description: 'HIGH' },
  { value: 'B', label: 'B', description: 'MEDIUM' },
  { value: 'C', label: 'C', description: 'LOW' },
];

const biasOptions = [
  { value: 'Left', label: '←', description: 'LEFT' },
  { value: 'Center', label: '○', description: 'CENTER' },
  { value: 'Right', label: '→', description: 'RIGHT' },
];

const timeRanges = [
  { value: '1h', label: '1H' },
  { value: '6h', label: '6H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    impactLevels: [],
    biases: [],
    timeRange: '24h',
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFilterCount =
    filters.impactLevels.length +
    filters.biases.length +
    (filters.timeRange !== '24h' ? 1 : 0);

  const toggleImpact = (value: string) => {
    const newLevels = filters.impactLevels.includes(value)
      ? filters.impactLevels.filter((l) => l !== value)
      : [...filters.impactLevels, value];
    const newFilters = { ...filters, impactLevels: newLevels };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleBias = (value: string) => {
    const newBiases = filters.biases.includes(value)
      ? filters.biases.filter((b) => b !== value)
      : [...filters.biases, value];
    const newFilters = { ...filters, biases: newBiases };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const setTimeRange = (value: string) => {
    const newFilters = { ...filters, timeRange: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    const newFilters = { impactLevels: [], biases: [], timeRange: '24h' };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 font-headline text-xs tracking-wider transition-all',
          isOpen || activeFilterCount > 0
            ? 'border-primary-500 bg-primary-500/10 text-primary-400'
            : 'border-border bg-surface-elevated text-muted-foreground hover:bg-surface-overlay hover:text-foreground'
        )}
      >
        <SlidersHorizontal className="size-4" />
        <span>FILTERS</span>
        {activeFilterCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded bg-primary-500 font-mono text-xs text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-surface-elevated p-4 shadow-xl animate-slide-in-up">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <span className="font-headline text-sm tracking-wider text-foreground">FILTERS</span>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="font-headline text-xs tracking-wider text-primary-400 hover:text-primary-300"
                >
                  CLEAR ALL
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-surface-overlay hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {/* Impact Level Filter */}
            <div>
              <span className="mb-2 block font-headline text-xs tracking-wider text-muted-foreground">
                IMPACT LEVEL
              </span>
              <div className="flex gap-1">
                {impactOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleImpact(option.value)}
                    className={cn(
                      'flex flex-1 flex-col items-center justify-center rounded-lg py-2 transition-all',
                      filters.impactLevels.includes(option.value)
                        ? cn(
                            'text-white',
                            option.value === 'S' && 'bg-impact-s shadow-lg shadow-impact-s/30',
                            option.value === 'A' && 'bg-impact-a shadow-lg shadow-impact-a/30',
                            option.value === 'B' && 'bg-impact-b text-black',
                            option.value === 'C' && 'bg-impact-c'
                          )
                        : 'bg-surface-overlay text-muted-foreground hover:bg-surface hover:text-foreground'
                    )}
                  >
                    <span className="font-headline text-lg">{option.label}</span>
                    <span className="text-[9px] opacity-75">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bias Filter */}
            <div>
              <span className="mb-2 block font-headline text-xs tracking-wider text-muted-foreground">
                MEDIA BIAS
              </span>
              <div className="flex gap-1">
                {biasOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleBias(option.value)}
                    className={cn(
                      'flex flex-1 flex-col items-center justify-center rounded-lg py-2 transition-all',
                      filters.biases.includes(option.value)
                        ? cn(
                            'text-white',
                            option.value === 'Left' && 'bg-bias-left shadow-lg shadow-bias-left/30',
                            option.value === 'Center' && 'bg-bias-center',
                            option.value === 'Right' && 'bg-bias-right shadow-lg shadow-bias-right/30'
                          )
                        : 'bg-surface-overlay text-muted-foreground hover:bg-surface hover:text-foreground'
                    )}
                  >
                    <span className="text-lg">{option.label}</span>
                    <span className="font-headline text-[9px] tracking-wider">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range Filter */}
            <div>
              <span className="mb-2 flex items-center gap-1 font-headline text-xs tracking-wider text-muted-foreground">
                <Clock className="size-3" />
                TIME RANGE
              </span>
              <div className="flex gap-1">
                {timeRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={cn(
                      'flex-1 rounded-lg py-2 font-headline text-xs tracking-wider transition-all',
                      filters.timeRange === range.value
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                        : 'bg-surface-overlay text-muted-foreground hover:bg-surface hover:text-foreground'
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
