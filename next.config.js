/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { hostname: 'image.api.playstation.com' },
      { hostname: 'ogimg.infoglobo.com.br' },
      { hostname: 'bnetcmsus-a.akamaihd.net' },
      { hostname: 'shared.fastly.steamstatic.com' },
      { hostname: 'assets.nintendo.com' },
      { hostname: 'cdn.discordapp.com' },
      { hostname: 'i.ytimg.com' },
    ],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
