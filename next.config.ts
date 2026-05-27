import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      html2canvas: "html2canvas-pro",
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      html2canvas: "html2canvas-pro",
    },
  },
};

export default nextConfig;
