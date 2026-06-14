// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.example.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.r2.dev', pathname: '/**' },
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
