/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  allowedDevOrigins: ['192.168.0.106'],
}

export default nextConfig
