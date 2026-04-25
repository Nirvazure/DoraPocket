import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dora-pocket.oss-cn-beijing.aliyuncs.com',
        pathname: '/market-favicons/**',
      },
    ],
  },
}

export default nextConfig
