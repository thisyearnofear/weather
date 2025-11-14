/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Enable compression
  compress: true,

  // Performance optimizations
  experimental: {
    // Enable scroll restoration
    scrollRestoration: true,
  },

  // Headers for better caching and security
  async headers() {
    return [
      {
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
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600',
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Disable split chunks for server to avoid self reference issues
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
        runtimeChunk: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
