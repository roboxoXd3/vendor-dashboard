// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.pravatar.cc', 'images.unsplash.com', 'cdn.example.com'],
  }
};

module.exports = nextConfig;
