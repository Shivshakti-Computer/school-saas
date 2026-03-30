// FILE: next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: '(?<subdomain>[^.]+)\\.vidyaflow\\.in' }],
        destination: '/website/:subdomain/:path*',
      },
    ]
  },
}

export default nextConfig