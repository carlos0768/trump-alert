import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec}s`;
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;

  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });
}

export function getSentimentColor(sentiment: number): string {
  if (sentiment > 0.3) return 'text-sentiment-positive';
  if (sentiment < -0.3) return 'text-sentiment-negative';
  return 'text-sentiment-neutral';
}

export function getImpactColor(level: string): string {
  switch (level) {
    case 'S':
      return 'bg-impact-s text-white';
    case 'A':
      return 'bg-impact-a text-white';
    case 'B':
      return 'bg-impact-b text-black';
    case 'C':
    default:
      return 'bg-impact-c text-white';
  }
}

export function getBiasColor(bias: string): string {
  switch (bias) {
    case 'Left':
      return 'bg-bias-left text-white';
    case 'Right':
      return 'bg-bias-right text-white';
    case 'Center':
    default:
      return 'bg-bias-center text-white';
  }
}
