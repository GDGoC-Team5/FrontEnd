import type { NextConfig } from 'next';

// 백엔드(Spring) 주소. 예: http://localhost:8080
// 이 값이 있으면 브라우저가 /api/... 로 보낸 요청을 Next가 백엔드로 그대로 넘겨줘요(프록시).
// 그래서 프론트와 백엔드가 같은 주소처럼 보여서 CORS·쿠키 문제가 거의 안 생겨요.
const backendUrl = process.env.BACKEND_URL;

const nextConfig: NextConfig = {
  // ESLint는 아직 안 깔았어요. 팀에서 린트 규칙 정하면 이 줄 지우고 eslint를 설치하세요.
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    if (!backendUrl) return [];
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
