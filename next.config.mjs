import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// Sanitize NEXTAUTH_URL so next-auth doesn't crash on new URL("") if empty in Vercel env
const rawNextAuthUrl = process.env.NEXTAUTH_URL?.trim()
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
const fallbackUrl = vercelUrl
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
  || (process.env.NODE_ENV === 'production' ? 'https://cpace-three.vercel.app' : 'http://localhost:3000')

if (!rawNextAuthUrl || !rawNextAuthUrl.startsWith('http')) {
  process.env.NEXTAUTH_URL = fallbackUrl
}
if (process.env.NEXTAUTH_URL_INTERNAL && !process.env.NEXTAUTH_URL_INTERNAL.startsWith('http')) {
  delete process.env.NEXTAUTH_URL_INTERNAL
}

/** @type {import('next').NextConfig} */
const nextConfig = {
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.pusher.com https://va.vercel-scripts.com https://cdn.jsdelivr.net https://vercel.live https://maps.googleapis.com https://www.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://vercel.com https://*.googleapis.com https://*.gstatic.com https://maps.gstatic.com https://streetviewpixels-pa.googleapis.com",
              "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://va.vercel-scripts.com https://cdn.jsdelivr.net https://storage.googleapis.com https://vercel.com https://vercel.live https://maps.googleapis.com",
              "frame-src 'self' https://maps.google.com https://www.google.com https://*.google.com https://recaptcha.google.com https://docs.google.com",
              "manifest-src 'self' https://vercel.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://vercel.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
