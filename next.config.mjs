import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// Sanitize NEXTAUTH_URL so next-auth doesn't crash on new URL("") if empty in Vercel env
const rawNextAuthUrl = process.env.NEXTAUTH_URL?.trim()
const fallbackUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://cpace.vercel.app'

if (!rawNextAuthUrl || !rawNextAuthUrl.startsWith('http')) {
  process.env.NEXTAUTH_URL = fallbackUrl
}
if (process.env.NEXTAUTH_URL_INTERNAL && !process.env.NEXTAUTH_URL_INTERNAL.startsWith('http')) {
  delete process.env.NEXTAUTH_URL_INTERNAL
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  turbopack: {
    root: projectRoot,
  },
  serverExternalPackages: ['@prisma/client'],
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.0.106', '192.168.254.120'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Allow external images used in the landing page and user profile avatars
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  // Security headers applied to all routes
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()',
          },
          ...(process.env.NODE_ENV === 'production'
            ? [{
                key: 'Strict-Transport-Security',
                value: 'max-age=31536000; includeSubDomains',
              }]
            : []),
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.pusher.com https://va.vercel-scripts.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com",
              "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://va.vercel-scripts.com https://cdn.jsdelivr.net https://storage.googleapis.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
