import type { NextConfig } from "next";

const ALB_API =
  process.env.ALB_API_ORIGIN ||
  "http://timia-alb-api-68624042.us-east-1.elb.amazonaws.com";
const ALB_IA =
  process.env.ALB_IA_ORIGIN ||
  "http://timia-alb-ia-285550099.us-east-1.elb.amazonaws.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: {
    position: "bottom-right",
  },
  // Proxy HTTPS (Amplify) → HTTP ALB: evita mixed content en el browser
  async rewrites() {
    return [
      { source: "/backend/:path*", destination: `${ALB_API}/:path*` },
      { source: "/ai/:path*", destination: `${ALB_IA}/:path*` },
    ];
  },
};

export default nextConfig;
