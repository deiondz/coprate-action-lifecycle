import type { NextConfig } from "next";
import "./env.config";

const FAVICONS = {
	preview: "/favicon.preview.ico",
	development: "/favicon.development.ico",
} as const;

const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
const favicon = FAVICONS[env as keyof typeof FAVICONS];

const nextConfig: NextConfig = {
	async rewrites() {
		if (!favicon) {
			return [];
		}

		return {
			beforeFiles: [
				{
					source: "/favicon.ico",
					destination: favicon,
				},
			],
		};
	},
};

export default nextConfig;
