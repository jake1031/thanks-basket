/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  devIndicators: false, // 개발 중 왼쪽 아래 'N' 표시 숨기기 (배포 사이트에는 원래 안 나옴)
  // 개발 중 같은 와이파이의 휴대폰에서 접속해 볼 수 있도록 허용
  allowedDevOrigins: ["192.168.0.29", "192.168.*.*"],
  // 개발 서버를 켠 채로 배포용 빌드를 따로 확인할 수 있게 (기본은 .next)
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
