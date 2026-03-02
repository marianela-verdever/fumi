import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xdfzhopzunoosmhlshcj.supabase.co",
      },
    ],
  },
};

export default nextConfig;
