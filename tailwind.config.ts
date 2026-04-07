import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {

      /* ── Fonts ── */
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      /* ── Colors ── */
      colors: {
        /* Primary — Indigo */
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          DEFAULT: '#6366f1',
        },

        /* Accent — Orange */
        accent: {
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          DEFAULT: '#f97316',
        },

        /* Success — Emerald */
        success: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          dark: '#065f46',
          DEFAULT: '#10b981',
        },

        /* Warning — Amber */
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          dark: '#92400e',
          DEFAULT: '#f59e0b',
        },

        /* Danger — Red */
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          dark: '#991b1b',
          DEFAULT: '#ef4444',
        },

        /* Info — Blue */
        info: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          dark: '#1e40af',
          DEFAULT: '#3b82f6',
        },

        /* Violet — Student portal */
        violet: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          DEFAULT: '#8b5cf6',
        },

        /* Emerald — Teacher portal */
        emerald: {
          50:  '#ecfdf5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          DEFAULT: '#10b981',
        },

        /* Amber — Parent portal */
        amber: {
          50:  '#fffbeb',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          DEFAULT: '#f59e0b',
        },

        /* Backgrounds */
        bg: {
          base:   '#f8f7ff',
          card:   '#ffffff',
          muted:  '#f1f0f9',
          subtle: '#faf9ff',
        },

        /* Surfaces (kept for backwards compat) */
        surface: {
          0:   '#ffffff',
          50:  '#f8f7ff',
          100: '#f1f0f9',
          200: '#e8e6f0',
          300: '#d1cfe8',
          DEFAULT: '#f8f7ff',
        },

        /* Text */
        text: {
          primary:   '#1e1b4b',
          secondary: '#4c4980',
          muted:     '#9794b8',
          light:     '#c4c2d4',
        },

        /* Borders */
        border: {
          DEFAULT: '#e8e6f0',
          strong:  '#d1cfe8',
          focus:   '#6366f1',
        },
      },

      /* ── Font Sizes ── */
      fontSize: {
        '2xs': ['0.625rem',  { lineHeight: '1rem' }],
        'xs':  ['0.75rem',   { lineHeight: '1.125rem' }],
        'sm':  ['0.875rem',  { lineHeight: '1.375rem' }],
        'base':['1rem',      { lineHeight: '1.625rem' }],
        'lg':  ['1.125rem',  { lineHeight: '1.75rem' }],
        'xl':  ['1.25rem',   { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem',    { lineHeight: '2rem' }],
        '3xl': ['1.875rem',  { lineHeight: '2.375rem' }],
        '4xl': ['2.25rem',   { lineHeight: '2.75rem' }],
        '5xl': ['3rem',      { lineHeight: '3.5rem' }],
        '6xl': ['3.75rem',   { lineHeight: '4.25rem' }],
      },

      /* ── Border Radius ── */
      borderRadius: {
        'xs':   '4px',
        'sm':   '6px',
        'md':   '10px',
        'lg':   '16px',
        'xl':   '20px',
        '2xl':  '28px',
        '3xl':  '36px',
        'full': '9999px',
      },

      /* ── Spacing extras ── */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '68': '17rem',
        '72': '18rem',
        '76': '19rem',
        '84': '21rem',
        '88': '22rem',
      },

      /* ── Max Width ── */
      maxWidth: {
        'container': '1280px',
        'container-wide': '1400px',
        'prose': '68ch',
      },

      /* ── Height/Width for portal layout ── */
      height: {
        'header': '60px',
      },

      width: {
        'sidebar': '260px',
        'sidebar-collapsed': '72px',
      },

      /* ── Box Shadows ── */
      boxShadow: {
        'xs': '0 1px 2px rgba(99, 102, 241, 0.06)',
        'sm': '0 1px 3px rgba(99, 102, 241, 0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'md': '0 4px 16px rgba(99, 102, 241, 0.12), 0 2px 4px rgba(0,0,0,0.04)',
        'lg': '0 8px 32px rgba(99, 102, 241, 0.15), 0 4px 8px rgba(0,0,0,0.06)',
        'xl': '0 20px 48px rgba(99, 102, 241, 0.18), 0 8px 16px rgba(0,0,0,0.08)',
        'card': '0 1px 3px rgba(99, 102, 241, 0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(99, 102, 241, 0.12), 0 2px 4px rgba(0,0,0,0.04)',
        'primary': '0 4px 14px rgba(99, 102, 241, 0.35)',
        'accent': '0 4px 14px rgba(249, 115, 22, 0.35)',
        'inset-sm': 'inset 0 1px 2px rgba(99, 102, 241, 0.06)',
      },

      /* ── Transitions ── */
      transitionTimingFunction: {
        'expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },

      /* ── Background Images ── */
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'gradient-accent':  'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
        'gradient-warm':    'linear-gradient(135deg, #6366f1 0%, #f97316 100%)',
        'gradient-aurora':  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #db2777 100%)',
        'hero-glow': `
          radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99,102,241,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 110%, rgba(249,115,22,0.08) 0%, transparent 60%)
        `,
      },

      /* ── Animations ── */
      animation: {
        'fade-in':       'fadeIn 0.5s ease-out forwards',
        'slide-up':      'slideUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down':    'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-left':    'slideLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in':      'scaleIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'float':         'float 6s ease-in-out infinite',
        'shimmer':       'shimmer 1.8s ease-in-out infinite',
        'pulse-soft':    'pulseSoft 2.5s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'spin-slow':     'spin 3s linear infinite',
        'portal-enter':  'portalContentIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },

      /* ── Keyframes ── */
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%':   { opacity: '0', transform: 'translateX(18px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-18px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.65', transform: 'scale(1.12)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        portalContentIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      /* ── Z-Index scale ── */
      zIndex: {
        '1':   '1',
        '5':   '5',
        '15':  '15',
        '25':  '25',
        '35':  '35',
        '45':  '45',
        '55':  '55',
        '60':  '60',
        '100': '100',
      },
    },
  },

  plugins: [],
}

export default config