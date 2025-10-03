/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Dropbox direct links
      { protocol: 'https', hostname: 'dl.dropboxusercontent.com' },
      { protocol: 'https', hostname: 'www.dropbox.com' },
      // Supabase storage (optional if you move images there)
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  experimental: {
    typedRoutes: true,
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
};

module.exports = nextConfig;


