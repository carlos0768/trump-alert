// Source configuration with icons and bias
// This provides a centralized configuration for all news sources

export type Bias = 'Left' | 'Center' | 'Right';

export interface SourceConfig {
  id: string;
  name: string;
  icon: string;
  bias: Bias;
}

// Source icon mapping - maps source names to their icon paths
// Only includes sources with actual icon files in /public/sources/
export const SOURCE_ICONS: Record<string, string> = {
  BBC: '/sources/bbc.png',
  'Fox News': '/sources/foxnews.png',
  'Truth Social': '/sources/truthsocial.png',
  NYT: '/sources/nytimes.png',
  'New York Times': '/sources/nytimes.png',
  NPR: '/sources/npr.png',
};

// Get icon path for a source, with fallback
export function getSourceIcon(source: string): string | undefined {
  return SOURCE_ICONS[source];
}

// Full source configurations
// Sources without icon files will show fallback (first letter)
export const SOURCES: SourceConfig[] = [
  { id: 'cnn', name: 'CNN', icon: '', bias: 'Left' },
  {
    id: 'foxnews',
    name: 'Fox News',
    icon: '/sources/foxnews.png',
    bias: 'Right',
  },
  { id: 'bbc', name: 'BBC', icon: '/sources/bbc.png', bias: 'Center' },
  {
    id: 'truthsocial',
    name: 'Truth Social',
    icon: '/sources/truthsocial.png',
    bias: 'Right',
  },
  { id: 'nyt', name: 'NYT', icon: '/sources/nytimes.png', bias: 'Left' },
  {
    id: 'reuters',
    name: 'Reuters',
    icon: '',
    bias: 'Center',
  },
  { id: 'npr', name: 'NPR', icon: '/sources/npr.png', bias: 'Left' },
];

// Get source config by ID or name
export function getSourceConfig(idOrName: string): SourceConfig | undefined {
  return SOURCES.find((s) => s.id === idOrName || s.name === idOrName);
}
