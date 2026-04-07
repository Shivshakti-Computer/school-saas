import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
          DEFAULT: '#2563EB',
        },
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          DEFAULT: '#F59E0B',
        },
        surface: {
          0: '#FFFFFF',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
        },
        slate: {
          750: '#293548',
        },
        // Portal-specific semantic colors
        portal: {
          bg: '#F8FAFC',
          sidebar: '#FFFFFF',
          'sidebar-hover': '#F1F5F9',
          'sidebar-active': '#EFF6FF',
          header: '#FFFFFF',
          card: '#FFFFFF',
          border: '#E2E8F0',
          'border-light': '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      
      // ✨ NEW: Optimized Animations (Notion-style - subtle & fast)
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.15s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'gradient-x': 'gradientX 8s ease infinite',
        'bounce-slow': 'bounceSlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        
        // Portal animations (faster)
        'sidebar-in': 'sidebarIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'sidebar-out': 'sidebarOut 0.15s ease-out forwards',
        'overlay-in': 'overlayIn 0.2s ease forwards',
        'overlay-out': 'overlayOut 0.15s ease forwards',
        'tooltip': 'tooltipIn 0.1s ease-out forwards',
        'dropdown': 'dropdownIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'count-up': 'countUp 0.4s ease-out forwards',
        
        // ✨ NEW: Notion-style micro-interactions
        'press': 'press 0.1s ease-out',
        'pop': 'pop 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.97)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sidebarIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        sidebarOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        overlayIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        overlayOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        tooltipIn: {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        dropdownIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        
        // ✨ NEW Keyframes
        press: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        skeleton: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'elevated': '0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.06)',
        'brand': '0 4px 16px -2px rgba(37, 99, 235, 0.2)',
        'brand-lg': '0 8px 32px -4px rgba(37, 99, 235, 0.25)',
        
        // Portal shadows (lighter)
        'sidebar': '2px 0 12px rgba(0, 0, 0, 0.04)',
        'header': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'nav-active': 'inset 3px 0 0 0 #2563EB',
        'inner-soft': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        
        // ✨ NEW: Notion-style subtle shadows
        'none': 'none',
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'focus': '0 0 0 3px rgba(37, 99, 235, 0.08)',
      },
      
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      
      // Optimized transitions
      transitionDuration: {
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'swift': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '17': '4.25rem',
        '18': '4.5rem',
        'sidebar': '16rem', // Slightly narrower
        'sidebar-collapsed': '4rem',
      },
      
      width: {
        'sidebar': '16rem',
        'sidebar-collapsed': '4rem',
      },
    },
  },
  plugins: [],
}

export default config