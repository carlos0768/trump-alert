import type { TrumpIndexData } from './api';

// Fallback data for Trump Index when API returns no data
export const mockTrumpIndexData: TrumpIndexData[] = [
  { time: '00:00', sentiment: 0.12, articleCount: 15 },
  { time: '02:00', sentiment: 0.08, articleCount: 8 },
  { time: '04:00', sentiment: -0.05, articleCount: 5 },
  { time: '06:00', sentiment: 0.15, articleCount: 12 },
  { time: '08:00', sentiment: 0.32, articleCount: 28 },
  { time: '10:00', sentiment: 0.45, articleCount: 42 },
  { time: '12:00', sentiment: 0.38, articleCount: 56 },
  { time: '14:00', sentiment: 0.22, articleCount: 48 },
  { time: '16:00', sentiment: -0.12, articleCount: 35 },
  { time: '18:00', sentiment: -0.28, articleCount: 41 },
  { time: '20:00', sentiment: -0.15, articleCount: 38 },
  { time: '22:00', sentiment: 0.05, articleCount: 22 },
];
