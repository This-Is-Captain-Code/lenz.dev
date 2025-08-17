/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@snap/camera-kit'],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config) => {
    config.externals.push({
      '@snap/camera-kit': '@snap/camera-kit'
    });
    return config;
  }
};

module.exports = nextConfig;