/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The admin portal talks to the existing Express backend. In dev we proxy /api/*
  // to it so the browser never deals with CORS or a second origin. Override the
  // target with ADMIN_API_PROXY (defaults to the local backend on :5000).
  async rewrites() {
    const target = process.env.ADMIN_API_PROXY || 'http://localhost:5000'
    return [{ source: '/api/:path*', destination: `${target}/api/:path*` }]
  },
}

export default nextConfig
