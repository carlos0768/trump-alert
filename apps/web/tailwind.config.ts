import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CNN Breaking News inspired dark theme
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Primary: Deep Crimson Red - Breaking News urgency
        primary: {
          DEFAULT: '#C41E3A',
          foreground: '#FFFFFF',
          50: '#FEF2F4',
          100: '#FDE6E9',
          200: '#FBD0D7',
          300: '#F7A8B6',
          400: '#F0758E',
          500: '#E54466',
          600: '#C41E3A',
          700: '#A91B33',
          800: '#8D1A30',
          900: '#781B2E',
          950: '#420A14',
        },

        // Secondary: Dark Navy - Professional authority
        secondary: {
          DEFAULT: '#0A1628',
          foreground: '#F8FAFC',
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#0A1628',
          950: '#050D18',
        },

        // Accent: Electric Blue - Live/Breaking indicator
        accent: {
          DEFAULT: '#00A8E8',
          foreground: '#FFFFFF',
          50: '#E6F7FD',
          100: '#B3E8F9',
          200: '#80D9F4',
          300: '#4DCAF0',
          400: '#1ABBEB',
          500: '#00A8E8',
          600: '#0087BA',
          700: '#00668C',
          800: '#00445D',
          900: '#00232F',
        },

        // Urgent: Bright Red for BREAKING alerts
        urgent: {
          DEFAULT: '#FF0000',
          dark: '#CC0000',
          light: '#FF3333',
          glow: '#FF000066',
        },

        // Surface colors for dark mode
        surface: {
          DEFAULT: '#0F172A',
          muted: 'hsl(var(--muted))',
          elevated: '#1E293B',
          overlay: '#334155',
        },

        // Muted colors
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        // Card colors
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // Semantic colors for sentiment
        sentiment: {
          positive: '#10B981',
          negative: '#EF4444',
          neutral: '#6B7280',
        },

        // Impact level colors - more vivid for dark mode
        impact: {
          s: '#FF0000',
          a: '#FF6B00',
          b: '#FBBF24',
          c: '#64748B',
        },

        // Bias colors
        bias: {
          left: '#3B82F6',
          center: '#94A3B8',
          right: '#EF4444',
        },

        // Popover
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        // Destructive
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        // Bebas Neue for headlines - bold, condensed, news feel
        headline: ['var(--font-bebas)', 'Impact', 'sans-serif'],
        // DM Sans for body - clean, modern readability
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        // Mono for data/numbers
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Headline sizes for breaking news impact
        'headline-xl': ['4rem', { lineHeight: '1', letterSpacing: '0.02em' }],
        'headline-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '0.02em' }],
        'headline-md': ['2rem', { lineHeight: '1.2', letterSpacing: '0.01em' }],
        'headline-sm': [
          '1.5rem',
          { lineHeight: '1.3', letterSpacing: '0.01em' },
        ],
      },
      animation: {
        'pulse-urgent': 'pulse-urgent 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-up': 'slide-in-up 0.4s ease-out',
        'breaking-glow': 'breaking-glow 1.5s ease-in-out infinite',
        ticker: 'ticker 30s linear infinite',
        'fade-in': 'fade-in 0.5s ease-out',
      },
      keyframes: {
        'pulse-urgent': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'breaking-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 0, 0, 0.8)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-breaking':
          'linear-gradient(135deg, #C41E3A 0%, #8B0000 100%)',
        'gradient-live': 'linear-gradient(90deg, #00A8E8 0%, #0077B6 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0A1628 0%, #0F172A 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
