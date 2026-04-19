import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "c.saavncdn.com",
      },
      {
        protocol: "https",
        hostname: "**.saavncdn.com",
      },
      {
        protocol: "https",
        hostname: "www.jiosaavn.com",
      },
      {
        protocol: "https",
        hostname: "**.jiosaavn.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.wireway.ch",
      },
      {
        protocol: "https",
        hostname: "**.tokhmi.xyz",
      },
      {
        protocol: "https",
        hostname: "**.projectsegfau.lt",
      },
      {
        protocol: "https",
        hostname: "**.piped.video",
      },
      {
        protocol: "https",
        hostname: "**.kavin.rocks",
      },
    ],
  },
};

export default pwaConfig(nextConfig);
