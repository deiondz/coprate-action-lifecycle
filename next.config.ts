import type { NextConfig } from "next";
import "./env.config";

const FAVICONS = {
	preview: "/favicon.preview.ico",
	development: "/favicon.development.ico",
} as const;

const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
const favicon = FAVICONS[env as keyof typeof FAVICONS];

const nextConfig: NextConfig = {
	output: "standalone",
	async rewrites() {
		const beforeFiles = [
			{
				source: "/backend/:path*",
				destination: `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/:path*`,
			},
		];
		if (favicon) {
			beforeFiles.push({ source: "/favicon.ico", destination: favicon });
		}
		return {
			beforeFiles,
		};
	},
};

export default nextConfig;
