import type { Config } from 'tailwindcss'

const config: Config = {
  // ── Content Paths ──────────────────────────────────────────
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,tsx}',
    './src/utils/**/*.{js,ts}',
  ],

  // ── Dark Mode ──────────────────────────────────────────────
  // 'class' strategy: <html class="dark"> se toggle hoga
  // Portal me user preference + system preference dono support
  darkMode: ['class', '[data-theme="dark"]'],

  theme: {
    // ── Override defaults selectively ──────────────────────
    screens: {
      'xs':  '400px',   // Small phones
      'sm':  '640px',
      'md':  '768px',
      'lg':  '1024px',
      'xl':  '1280px',
      '2xl': '1400px',  // Wide screens / dashboards
      // Portal-specific breakpoints
      'portal-sm': '900px',   // Sidebar shows
      'portal-lg': '1200px',  // Expanded layout
    },

    extend: {
      /* ── Fonts ──────────────────────────────────────────── */
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      /* ── Colors ─────────────────────────────────────────── */
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
          950: '#1e1b4b',  // ← Added for deep dark usage
          DEFAULT: '#6366f1',
        },

        /* Accent — Orange */
        accent: {
          50:  '#fff7ed',  // ← Added
          100: '#ffedd5',  // ← Added
          200: '#fed7aa',  // ← Added
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',  // ← Added
          DEFAULT: '#f97316',
        },

        /* Success — Emerald */
        success: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',  // ← Added
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          dark: '#065f46',
          DEFAULT: '#10b981',
        },

        /* Warning — Amber */
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',  // ← Added
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          800: '#92400e',
          dark: '#92400e',
          DEFAULT: '#f59e0b',
        },

        /* Danger — Red */
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',  // ← Added
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          800: '#991b1b',
          dark: '#991b1b',
          DEFAULT: '#ef4444',
        },

        /* Info — Blue */
        info: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',  // ← Added
          500: '#3b82f6',
          600: '#2563eb',
          800: '#1e40af',
          dark: '#1e40af',
          DEFAULT: '#3b82f6',
        },

        /* Violet — Student portal */
        violet: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',  // ← Added
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',  // ← Added
          DEFAULT: '#8b5cf6',
        },

        /* Emerald — Teacher portal */
        emerald: {
          50:  '#ecfdf5',
          100: '#d1fae5',  // ← Added
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          DEFAULT: '#10b981',
        },

        /* Amber — Parent portal */
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',  // ← Added
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

        /* Surfaces */
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

      /* ── Font Sizes ─────────────────────────────────────── */
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

      /* ── Border Radius ──────────────────────────────────── */
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

      /* ── Spacing ────────────────────────────────────────── */
      spacing: {
        '4.5': '1.125rem',  // ← Added — common gap
        '13':  '3.25rem',   // ← Added
        '15':  '3.75rem',   // ← Added
        '18':  '4.5rem',
        '22':  '5.5rem',
        '26':  '6.5rem',
        '30':  '7.5rem',
        '68':  '17rem',
        '72':  '18rem',
        '76':  '19rem',
        '84':  '21rem',
        '88':  '22rem',
        '92':  '23rem',     // ← Added
        '96':  '24rem',
        '128': '32rem',     // ← Added — modal widths
      },

      /* ── Max Width ──────────────────────────────────────── */
      maxWidth: {
        'container':      '1280px',
        'container-wide': '1400px',
        'prose':          '68ch',
        'modal-sm':       '400px',   // ← Added
        'modal-md':       '560px',   // ← Added
        'modal-lg':       '720px',   // ← Added
        'modal-xl':       '900px',   // ← Added
      },

      /* ── Height ─────────────────────────────────────────── */
      height: {
        'header':          '60px',
        'header-mobile':   '56px',   // ← Added
        'portal-content':  'calc(100vh - 60px)',  // ← Added
      },

      /* ── Width ──────────────────────────────────────────── */
      width: {
        'sidebar':           '260px',
        'sidebar-collapsed': '72px',
      },

      /* ── Min Height ─────────────────────────────────────── */
      minHeight: {
        'screen-header': 'calc(100vh - 60px)',  // ← Added
        '10': '2.5rem',
        '12': '3rem',
      },

      /* ── Box Shadows ────────────────────────────────────── */
      boxShadow: {
        'xs':         '0 1px 2px rgba(99, 102, 241, 0.06)',
        'sm':         '0 1px 3px rgba(99, 102, 241, 0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'md':         '0 4px 16px rgba(99, 102, 241, 0.12), 0 2px 4px rgba(0,0,0,0.04)',
        'lg':         '0 8px 32px rgba(99, 102, 241, 0.15), 0 4px 8px rgba(0,0,0,0.06)',
        'xl':         '0 20px 48px rgba(99, 102, 241, 0.18), 0 8px 16px rgba(0,0,0,0.08)',
        'card':       '0 1px 3px rgba(99, 102, 241, 0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(99, 102, 241, 0.12), 0 2px 4px rgba(0,0,0,0.04)',
        'primary':    '0 4px 14px rgba(99, 102, 241, 0.35)',
        'accent':     '0 4px 14px rgba(249, 115, 22, 0.35)',
        'inset-sm':   'inset 0 1px 2px rgba(99, 102, 241, 0.06)',
        // ← Production additions
        'modal':      '0 25px 60px rgba(30, 27, 75, 0.25), 0 10px 20px rgba(0,0,0,0.1)',
        'dropdown':   '0 8px 24px rgba(99, 102, 241, 0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'toast':      '0 8px 32px rgba(30, 27, 75, 0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'focus':      '0 0 0 3px rgba(99, 102, 241, 0.15)',
        'focus-danger': '0 0 0 3px rgba(239, 68, 68, 0.15)',
        'none':       'none',
      },

      /* ── Transitions ────────────────────────────────────── */
      transitionTimingFunction: {
        'expo':   'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'in':     'cubic-bezier(0.4, 0, 1, 1)',
        'out':    'cubic-bezier(0, 0, 0.2, 1)',
      },

      transitionDuration: {
        '75':  '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '700': '700ms',
      },

      /* ── Background Images ──────────────────────────────── */
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary':  'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'gradient-accent':   'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
        'gradient-warm':     'linear-gradient(135deg, #6366f1 0%, #f97316 100%)',
        'gradient-aurora':   'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #db2777 100%)',
        'gradient-success':  'linear-gradient(135deg, #10b981 0%, #059669 100%)',  // ← Added
        'gradient-danger':   'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',  // ← Added
        'hero-glow': `
          radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99,102,241,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 110%, rgba(249,115,22,0.08) 0%, transparent 60%)
        `,
        // Portal stat card top borders
        'stat-primary':  'linear-gradient(90deg, #6366f1, #818cf8)',  // ← Added
        'stat-success':  'linear-gradient(90deg, #10b981, #34d399)',  // ← Added
        'stat-warning':  'linear-gradient(90deg, #f59e0b, #fbbf24)',  // ← Added
        'stat-danger':   'linear-gradient(90deg, #ef4444, #f87171)', // ← Added
      },

      /* ── Animations ─────────────────────────────────────── */
      animation: {
        // Entry animations
        'fade-in':       'fadeIn 0.5s ease-out forwards',
        'fade-out':      'fadeOut 0.3s ease-in forwards',  // ← Added
        'slide-up':      'slideUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down':    'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-left':    'slideLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right':   'slideRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards', // ← Added
        'scale-in':      'scaleIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scale-out':     'scaleOut 0.2s ease-in forwards', // ← Added
        // Continuous animations
        'float':         'float 6s ease-in-out infinite',
        'shimmer':       'shimmer 1.8s ease-in-out infinite',
        'pulse-soft':    'pulseSoft 2.5s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'spin-slow':     'spin 3s linear infinite',
        // Portal specific
        'portal-enter':  'portalContentIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'sidebar-in':    'sidebarIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',  // ← Added
        'overlay-in':    'overlayIn 0.25s ease forwards',    // ← Added
        'toast-in':      'toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',    // ← Added
        'toast-out':     'toastOut 0.3s ease-in forwards',   // ← Added
      },

      /* ── Keyframes ──────────────────────────────────────── */
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
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
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-18px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%':   { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
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
          '0%, 100%': { opacity: '1',    transform: 'scale(1)' },
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
        sidebarIn: {
          'from': { transform: 'translateX(-100%)', opacity: '0' },
          'to':   { transform: 'translateX(0)',     opacity: '1' },
        },
        overlayIn: {
          'from': { opacity: '0' },
          'to':   { opacity: '1' },
        },
        // Toast slides in from right
        toastIn: {
          '0%':   { opacity: '0', transform: 'translateX(100%) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        toastOut: {
          '0%':   { opacity: '1', transform: 'translateX(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateX(100%) scale(0.95)' },
        },
      },

      /* ── Z-Index Scale ──────────────────────────────────── */
      // Systematic z-index — no random values across codebase
      zIndex: {
        '1':   '1',     // Slight elevation
        '5':   '5',     // Cards hover
        '10':  '10',    // Dropdowns
        '15':  '15',
        '20':  '20',    // Sticky elements
        '25':  '25',
        '30':  '30',    // Portal header
        '35':  '35',
        '40':  '40',    // Mobile overlay
        '45':  '45',
        '50':  '50',    // Sidebar mobile
        '55':  '55',
        '60':  '60',    // Modals
        '70':  '70',    // Toast notifications
        '80':  '80',    // Tooltips
        '90':  '90',    // Command palette
        '100': '100',   // Critical overlays
        'max': '2147483647',
      },

      /* ── Opacity ────────────────────────────────────────── */
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '65': '0.65',
        '85': '0.85',
      },

      /* ── Blur ───────────────────────────────────────────── */
      blur: {
        'xs': '2px',
        '4xl': '72px',
      },
    },
  },

  plugins: [
    // NOTE: Uncomment these as you install them
    // require('@tailwindcss/forms'),        // Form reset & styling
    // require('@tailwindcss/typography'),   // Prose content
    // require('@tailwindcss/aspect-ratio'), // Media aspect ratios
    // require('tailwindcss-animate'),       // Additional animations
  ],
}

export default config