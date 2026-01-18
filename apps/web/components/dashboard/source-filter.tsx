'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SOURCES } from '@/lib/sources';

interface Source {
  id: string;
  name: string;
  icon?: string;
  bias: 'Left' | 'Center' | 'Right';
}

interface SourceFilterProps {
  sources: Source[];
  selectedSources: string[];
  onSelectionChange: (sources: string[]) => void;
}

export function SourceFilter({
  sources,
  selectedSources,
  onSelectionChange,
}: SourceFilterProps) {
  const toggleSource = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      onSelectionChange(selectedSources.filter((id) => id !== sourceId));
    } else {
      onSelectionChange([...selectedSources, sourceId]);
    }
  };

  const biasColor = {
    Left: 'border-blue-300 bg-blue-50',
    Center: 'border-gray-300 bg-gray-50',
    Right: 'border-red-300 bg-red-50',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {sources.map((source) => {
        const isSelected = selectedSources.includes(source.id);
        return (
          <button
            key={source.id}
            onClick={() => toggleSource(source.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
              isSelected
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : cn('text-gray-600 hover:bg-gray-100', biasColor[source.bias])
            )}
          >
            {isSelected && <Check className="size-3" />}
            {source.name}
          </button>
        );
      })}
    </div>
  );
}

export const mockSources: Source[] = SOURCES.map((s) => ({
  id: s.id,
  name: s.name,
  icon: s.icon,
  bias: s.bias,
}));
