import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CPACE Philippines | Professional Advancement & Continuing Education',
    short_name: 'CPACE',
    description:
      'CPACE Philippines — Professional development and continuing education learning management system.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1B6B37',
    icons: [
      {
        src: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/cpace-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/cpace-logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
