/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  devIndicators: false, // 개발 중 왼쪽 아래 'N' 표시 숨기기 (배포 사이트에는 원래 안 나옴)
};
export default nextConfig;
