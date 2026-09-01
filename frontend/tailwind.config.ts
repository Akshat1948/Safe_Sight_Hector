import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette Base Colors:
        // Almond: #D6BD98
        // Matcha Brew: #677D6A
        // Forest Roast: #40534C
        // Eclipse: #1A3636

        // Primary: Eclipse & Forest Roast
        'primary': '#1A3636',
        'on-primary': '#ffffff',
        'primary-container': '#40534C',
        'on-primary-container': '#F2EFE9',
        'primary-fixed': '#D6BD98',
        'primary-fixed-dim': '#C5AB85',
        'on-primary-fixed': '#1A3636',
        'on-primary-fixed-variant': '#40534C',

        // Secondary: Forest Roast & Matcha
        'secondary': '#40534C',
        'on-secondary': '#ffffff',
        'secondary-container': '#677D6A',
        'on-secondary-container': '#ffffff',
        'secondary-fixed': '#E8EFEA',
        'secondary-fixed-dim': '#D6BD98',
        'on-secondary-fixed': '#1A3636',
        'on-secondary-fixed-variant': '#40534C',

        // Tertiary: Matcha Brew & Almond
        'tertiary': '#677D6A',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#D6BD98',
        'on-tertiary-container': '#1A3636',
        'tertiary-fixed': '#E8DFC8',
        'tertiary-fixed-dim': '#D6BD98',
        'on-tertiary-fixed': '#1A3636',
        'on-tertiary-fixed-variant': '#40534C',

        // Surfaces & Backgrounds
        'background': '#F6F8F7',
        'surface': '#FFFFFF',
        'surface-bright': '#FFFFFF',
        'surface-dim': '#DDE5E0',
        'surface-variant': '#E5ECE8',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F0F4F2',
        'surface-container': '#E6EDE9',
        'surface-container-high': '#DBE5E0',
        'surface-container-highest': '#D0DDD7',
        'surface-tint': '#1A3636',

        'inverse-surface': '#1A3636',
        'inverse-on-surface': '#F0F4F2',
        'inverse-primary': '#D6BD98',

        // Text & Outlines
        'text-main': '#1A3636',
        'on-surface': '#1A3636',
        'on-surface-variant': '#40534C',
        'on-background': '#1A3636',
        'outline': '#677D6A',
        'outline-variant': '#CBD6CF',
        'border-subtle': '#DCE4DF',

        // Status Colors Harmonized
        'status-nominal': '#677D6A',
        'status-warning': '#D97706',
        'status-critical': '#BA1A1A',
        'error': '#BA1A1A',
        'error-container': '#FFDAD6',
        'on-error': '#ffffff',
        'on-error-container': '#93000A',

        // Named palette aliases
        'almond': '#D6BD98',
        'matcha': '#677D6A',
        'forest': '#40534C',
        'eclipse': '#1A3636',

        // Legacy compatibility aliases
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        warning: {
          50: '#fffbeb',
          500: '#d97706',
          600: '#b45309',
        },
        safe: {
          50: '#f0fdf4',
          500: '#677d6a',
          600: '#40534c',
        },
      },
      borderRadius: {
        none: '0px',
        sm: '6px',
        DEFAULT: '6px',
        md: '6px',
        lg: '6px',
        xl: '6px',
        '2xl': '6px',
        '3xl': '6px',
        full: '9999px',
      },
      spacing: {
        'margin-mobile': '1rem',
        'sidebar-width': '256px',
        'sidebar-icon-width': '64px',
        'rail-width': '64px',
        'unit': '4px',
        'gutter': '1rem',
        'margin-desktop': '1.5rem',
        'topbar-height': '56px',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        'headline-md-mobile': ['Space Grotesk', 'sans-serif'],
        'stat-lg': ['Space Grotesk', 'sans-serif'],
        'headline-md': ['Space Grotesk', 'sans-serif'],
        'label-caps': ['Space Grotesk', 'sans-serif'],
        'body-bold': ['Space Grotesk', 'sans-serif'],
        'headline-sm': ['Space Grotesk', 'sans-serif'],
        'display-lg': ['Space Grotesk', 'sans-serif'],
        'telemetry-md': ['Space Grotesk', 'sans-serif'],
        'body-base': ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'headline-md-mobile': ['18px', { lineHeight: '24px', fontWeight: '700' }],
        'stat-lg': ['28px', { lineHeight: '32px', letterSpacing: '-0.03em', fontWeight: '800' }],
        'headline-md': ['20px', { lineHeight: '28px', letterSpacing: '-0.015em', fontWeight: '700' }],
        'label-caps': ['11px', { lineHeight: '14px', letterSpacing: '0.08em', fontWeight: '700' }],
        'body-bold': ['14px', { lineHeight: '20px', letterSpacing: '0', fontWeight: '600' }],
        'headline-sm': ['16px', { lineHeight: '24px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-lg': ['36px', { lineHeight: '44px', letterSpacing: '-0.025em', fontWeight: '800' }],
        'telemetry-md': ['18px', { lineHeight: '24px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-base': ['14px', { lineHeight: '20px', letterSpacing: '0', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};

export default config;

