import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actionsのボディサイズ制限を500MBに引き上げ（動画アップロード用）
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  // 外部画像・動画のドメインを許可
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
  // Turbopack設定（空でもOK）
  turbopack: {},
};

export default nextConfig;
