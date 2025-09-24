/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Убрали rewrites, так как переменные окружения не доступны при сборке
  env: {
    // Переменные с префиксом NEXT_PUBLIC_ будут доступны на клиенте
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig
