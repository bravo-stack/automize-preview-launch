/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: () => [
    {
      source: '/dashboard/communication-audit',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, must-revalidate',
        },
      ],
    },
  ],
}

export default nextConfig
