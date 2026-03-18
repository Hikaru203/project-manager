import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  // Khi deploy lên GitHub Pages, URL sẽ có dạng /project-manager
  // Nếu bạn dùng custom domain, hãy xóa 2 dòng bên dưới
  basePath: isProd ? '/project-manager' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
