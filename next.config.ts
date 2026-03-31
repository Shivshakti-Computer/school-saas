// // FILE: next.config.ts
// import type { NextConfig } from 'next'

// const nextConfig: NextConfig = {
//   reactCompiler: true,

//   async rewrites() {
//     return [
//       {
//         source: '/:path*',
//         has: [{ type: 'host', value: '(?<subdomain>[^.]+)\\.vidyaflow\\.in' }],
//         destination: '/website/:subdomain/:path*',
//       },
//     ]
//   },
// }

// export default nextConfig


// FILE: next.config.ts (ADD security headers section)

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ... your existing config

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        // Stricter CSP for API routes
        source: '/api/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig