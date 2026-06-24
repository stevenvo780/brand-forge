/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // pg is a server-only dependency; keep it external to the bundle.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
