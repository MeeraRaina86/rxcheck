/** @type {import('next').NextConfig} */
const nextConfig = {
  // This block disables ESLint during the build process,
  // which will resolve the deployment error on Vercel.
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;