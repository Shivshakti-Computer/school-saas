// tailwind.config.ts
// Tailwind v4 — Minimal config
// Sab theme @theme{} block in globals.css mein hai

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,tsx}',
    './src/utils/**/*.{js,ts}',
  ],
  // v4 mein darkMode, theme, plugins
  // sab globals.css ke @theme{} mein jaata hai
}

export default config