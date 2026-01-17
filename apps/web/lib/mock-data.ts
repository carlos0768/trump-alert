import type { Article } from '@/components/article';

export const mockArticles: Article[] = [
  {
    id: '1',
    title:
      'Trump Announces New Tariff Policy on Chinese Imports, Markets React',
    url: 'https://example.com/trump-tariff-policy',
    source: 'Fox News',
    sourceIcon: '/sources/foxnews.png',
    content:
      'Former President Donald Trump announced a sweeping new tariff policy targeting Chinese imports during a rally in Iowa...',
    publishedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    imageUrl:
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=450&fit=crop',
    summary: [
      '25% tariff on all Chinese electronics proposed',
      'Markets show mixed reaction to announcement',
      'Biden administration criticizes the plan',
    ],
    sentiment: 0.35,
    bias: 'Right',
    impactLevel: 'A',
    stats: {
      comments: 4650,
      reposts: 6240,
      likes: 29000,
    },
  },
  {
    id: '2',
    title: 'Breaking: Trump Indictment Updates - New Evidence Presented',
    url: 'https://example.com/trump-indictment-updates',
    source: 'CNN',
    sourceIcon: '/sources/cnn.png',
    content:
      'Special Counsel presents new documentary evidence in the ongoing federal case against former President Trump...',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    imageUrl:
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=450&fit=crop',
    summary: [
      'New classified documents discovered',
      'Trial date may be pushed back',
      'Defense team requests additional time',
    ],
    sentiment: -0.65,
    bias: 'Left',
    impactLevel: 'S',
    stats: {
      comments: 12500,
      reposts: 18300,
      likes: 45000,
    },
  },
  {
    id: '3',
    title: 'Truth Social Post: Trump Calls for Unity Among Republicans',
    url: 'https://truthsocial.com/@realDonaldTrump/123456',
    source: 'Truth Social',
    sourceIcon: '/sources/truthsocial.png',
    content:
      'We need to come together as one party, one movement, one people. The MAGA movement is stronger than ever!',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    summary: [
      'Calls for Republican party unity',
      'References MAGA movement strength',
      'Hints at upcoming campaign events',
    ],
    sentiment: 0.72,
    bias: 'Right',
    impactLevel: 'B',
    stats: {
      comments: 8900,
      reposts: 15600,
      likes: 89000,
    },
  },
  {
    id: '4',
    title: 'Analysis: Impact of Trump Policies on Global Trade Relations',
    url: 'https://example.com/trump-global-trade-analysis',
    source: 'Reuters',
    sourceIcon: '/sources/reuters.png',
    content:
      'An in-depth analysis of how potential Trump administration policies could reshape international trade...',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    imageUrl:
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=450&fit=crop',
    summary: [
      'Trade experts weigh in on policy implications',
      'EU prepares contingency measures',
      'Asian markets show concern',
    ],
    sentiment: -0.15,
    bias: 'Center',
    impactLevel: 'B',
    stats: {
      comments: 2100,
      reposts: 3400,
      likes: 8500,
    },
  },
  {
    id: '5',
    title: 'DJT Stock Surges 15% Following Campaign Rally',
    url: 'https://example.com/djt-stock-surge',
    source: 'BBC',
    sourceIcon: '/sources/bbc.png',
    content:
      'Trump Media & Technology Group shares experienced significant gains following a major campaign event...',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    summary: [
      'DJT stock up 15% in single trading session',
      'Trading volume exceeds 50 million shares',
      'Analysts attribute gains to rally momentum',
    ],
    sentiment: 0.55,
    bias: 'Center',
    impactLevel: 'A',
    stats: {
      comments: 3200,
      reposts: 5100,
      likes: 12000,
    },
  },
  {
    id: '6',
    title: 'Vance Defends Trump Immigration Stance in Senate Hearing',
    url: 'https://example.com/vance-immigration-hearing',
    source: 'Fox News',
    sourceIcon: '/sources/foxnews.png',
    content:
      'Senator JD Vance delivered a passionate defense of Trump-era immigration policies during a heated Senate committee hearing...',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
    imageUrl:
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=450&fit=crop',
    summary: [
      'Vance cites border security statistics',
      'Democrats challenge policy effectiveness',
      'Discussion becomes heated exchange',
    ],
    sentiment: 0.28,
    bias: 'Right',
    impactLevel: 'B',
    stats: {
      comments: 5600,
      reposts: 7800,
      likes: 23000,
    },
  },
];

import type { TrumpIndexData } from './api';

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
