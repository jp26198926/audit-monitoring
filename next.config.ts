import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // For deployment in Apache subdirectory
  // Set basePath to empty string for root deployment or '/your-folder-name' for subdirectory
  basePath: process.env.BASE_PATH || "",
  // Asset prefix for proper static file loading
  assetPrefix: process.env.BASE_PATH || "",
  // Trailing slash configuration
  trailingSlash: false,
};

export default nextConfig;
