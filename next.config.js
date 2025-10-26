/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fall back to Babel if SWC has issues
  swcMinify: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;

