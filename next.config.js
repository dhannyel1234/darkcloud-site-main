/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'image.api.playstation.com' },
      { hostname: 'ogimg.infoglobo.com.br' },
      { hostname: 'bnetcmsus-a.akamaihd.net' },
      { hostname: 'shared.fastly.steamstatic.com' },
      { hostname: 'assets.nintendo.com' },
      { hostname: 'cdn.discordapp.com' },
      { hostname: 'i.ytimg.com' },
      { hostname: 'images-ext-1.discordapp.net' },
    ],
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
