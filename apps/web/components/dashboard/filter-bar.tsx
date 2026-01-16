'use client';

import { useState } from 'react';
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
  const [filters, setFilters] = useState<FilterState>({
    impactLevels: [],
    biases: [],
    timeRange: '24h',
  });

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
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-3">
      {/* Impact Level Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Impact:</span>
        <div className="flex gap-1">
          {impactOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleImpact(option.value)}
              className={cn(
                'flex size-7 items-center justify-center rounded-md text-xs font-bold transition-all',
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

      <div className="h-6 w-px bg-gray-200" />

      {/* Bias Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Bias:</span>
        <div className="flex gap-1">
          {biasOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleBias(option.value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
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

      <div className="h-6 w-px bg-gray-200" />

      {/* Time Range Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Time:</span>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
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
  );
}
