'use client';

import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
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
  { value: 'S', label: 'S', color: 'bg-red-600' },
  { value: 'A', label: 'A', color: 'bg-orange-500' },
  { value: 'B', label: 'B', color: 'bg-yellow-500' },
  { value: 'C', label: 'C', color: 'bg-gray-500' },
];

const biasOptions = [
  { value: 'Left', label: 'Left', color: 'bg-blue-500' },
  { value: 'Center', label: 'Center', color: 'bg-gray-500' },
  { value: 'Right', label: 'Right', color: 'bg-red-500' },
];

const timeRanges = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    impactLevels: [],
    biases: [],
    timeRange: '24h',
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count active filters
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

  return (
    <div className="relative" ref={menuRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
          isOpen || activeFilterCount > 0
            ? 'border-primary-500 bg-primary-50 text-primary-700'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        <SlidersHorizontal className="size-4" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium text-gray-900">Filters</span>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Impact Level Filter */}
            <div>
              <span className="mb-2 block text-xs font-medium text-gray-500">
                Impact Level
              </span>
              <div className="flex gap-1">
                {impactOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleImpact(option.value)}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-md text-xs font-bold transition-all',
                      filters.impactLevels.includes(option.value)
                        ? cn(option.color, 'text-white')
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bias Filter */}
            <div>
              <span className="mb-2 block text-xs font-medium text-gray-500">
                Bias
              </span>
              <div className="flex gap-1">
                {biasOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleBias(option.value)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                      filters.biases.includes(option.value)
                        ? cn(option.color, 'text-white')
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range Filter */}
            <div>
              <span className="mb-2 block text-xs font-medium text-gray-500">
                Time Range
              </span>
              <div className="flex flex-wrap gap-1">
                {timeRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                      filters.timeRange === range.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
