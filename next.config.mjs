/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // pg + playwright are server-only deps; keep them external to the bundle so
  // Next does not try to trace/bundle native/runtime modules.
  serverExternalPackages: ["pg", "playwright", "playwright-core"],
};

export default nextConfig;
