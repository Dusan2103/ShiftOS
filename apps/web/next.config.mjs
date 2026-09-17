import withPWAInit from '@ducanh2912/next-pwa';

const jeStaticniBuild = process.env.BUILD_TARGET === 'static';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development' || jeStaticniBuild,
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'shiftos-api',
          networkTimeoutSeconds: 4,
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
        },
      },
      {
        urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'shiftos-static',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  ...(jeStaticniBuild
    ? { output: 'export', images: { unoptimized: true }, basePath: '/assets/www' }
    : {}),
};

export default jeStaticniBuild ? nextConfig : withPWA(nextConfig);
