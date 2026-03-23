import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Remove the old deprecated domains array
    // domains: ["images.unsplash.com"],  // ← delete or comment this out

    remotePatterns: [
      // Keep allowing Unsplash (your original one)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**", // allows any path on this domain
      },

      // Add Cloudinary (this fixes your "res.cloudinary.com" error)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // allows any path (or tighten to "/disniu3hn/**" for your account only)
      },

      // Optional: If you use Cloudinary subdomains or transformations with query strings
      // You can add more specific patterns if needed later
    ],
  },
  // ... add any other config options here if you have them
};

export default nextConfig;