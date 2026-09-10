import { defineEnv } from "envin";
import * as z from "zod";

const env = defineEnv({
	shared: {
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	server: {
		DATABASE_URL: z
			.string()
			.url()
			.refine(
				(url) =>
					url.startsWith("postgresql://") || url.startsWith("postgres://"),
				{
					message: "DATABASE_URL must be a PostgreSQL connection string",
				},
			)
			.optional(),
		MONGODB_URI: z
			.string()
			.url()
			.refine(
				(url) =>
					url.startsWith("mongodb://") || url.startsWith("mongodb+srv://"),
				{
					message: "MONGODB_URI must be a MongoDB connection string",
				},
			),
		MONGODB_MAX_POOL_SIZE: z.coerce
			.number()
			.int()
			.positive()
			.max(100)
			.default(10),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.string().url().optional(),
		APP_NAME: z.string().min(1).default("Nevin"),
		ZEPTOMAIL_TOKEN: z.string().min(1).optional(),
		ZEPTOMAIL_FROM_EMAIL: z.string().email().optional(),
		ZEPTOMAIL_FROM_NAME: z.string().min(1).default("Nevin"),
		APPLE_CLIENT_ID: z.string().min(1).optional(),
		APPLE_CLIENT_SECRET: z.string().min(1).optional(),
		ATLASSIAN_CLIENT_ID: z.string().min(1).optional(),
		ATLASSIAN_CLIENT_SECRET: z.string().min(1).optional(),
		COGNITO_CLIENT_ID: z.string().min(1).optional(),
		COGNITO_CLIENT_SECRET: z.string().min(1).optional(),
		COGNITO_DOMAIN: z.string().min(1).optional(),
		COGNITO_REGION: z.string().min(1).optional(),
		COGNITO_REQUIRE_CLIENT_SECRET: z.string().min(1).optional(),
		COGNITO_USER_POOL_ID: z.string().min(1).optional(),
		DISCORD_CLIENT_ID: z.string().min(1).optional(),
		DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
		DROPBOX_CLIENT_ID: z.string().min(1).optional(),
		DROPBOX_CLIENT_SECRET: z.string().min(1).optional(),
		FACEBOOK_CLIENT_ID: z.string().min(1).optional(),
		FACEBOOK_CLIENT_SECRET: z.string().min(1).optional(),
		FIGMA_CLIENT_ID: z.string().min(1).optional(),
		FIGMA_CLIENT_SECRET: z.string().min(1).optional(),
		GITHUB_CLIENT_ID: z.string().min(1).optional(),
		GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
		GITLAB_CLIENT_ID: z.string().min(1).optional(),
		GITLAB_CLIENT_SECRET: z.string().min(1).optional(),
		GITLAB_ISSUER: z.string().url().optional(),
		GOOGLE_CLIENT_ID: z.string().min(1).optional(),
		GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
		HUGGINGFACE_CLIENT_ID: z.string().min(1).optional(),
		HUGGINGFACE_CLIENT_SECRET: z.string().min(1).optional(),
		KAKAO_CLIENT_ID: z.string().min(1).optional(),
		KAKAO_CLIENT_SECRET: z.string().min(1).optional(),
		KICK_CLIENT_ID: z.string().min(1).optional(),
		KICK_CLIENT_SECRET: z.string().min(1).optional(),
		LINE_CLIENT_ID: z.string().min(1).optional(),
		LINE_CLIENT_SECRET: z.string().min(1).optional(),
		LINEAR_CLIENT_ID: z.string().min(1).optional(),
		LINEAR_CLIENT_SECRET: z.string().min(1).optional(),
		LINKEDIN_CLIENT_ID: z.string().min(1).optional(),
		LINKEDIN_CLIENT_SECRET: z.string().min(1).optional(),
		MICROSOFT_AUTHORITY: z.string().url().optional(),
		MICROSOFT_CLIENT_ID: z.string().min(1).optional(),
		MICROSOFT_CLIENT_SECRET: z.string().min(1).optional(),
		MICROSOFT_TENANT_ID: z.string().min(1).optional(),
		NAVER_CLIENT_ID: z.string().min(1).optional(),
		NAVER_CLIENT_SECRET: z.string().min(1).optional(),
		NOTION_CLIENT_ID: z.string().min(1).optional(),
		NOTION_CLIENT_SECRET: z.string().min(1).optional(),
		PAYBIN_CLIENT_ID: z.string().min(1).optional(),
		PAYBIN_CLIENT_SECRET: z.string().min(1).optional(),
		PAYBIN_ISSUER: z.string().url().optional(),
		PAYPAL_CLIENT_ID: z.string().min(1).optional(),
		PAYPAL_CLIENT_SECRET: z.string().min(1).optional(),
		PAYPAL_ENVIRONMENT: z.enum(["sandbox", "live"]).optional(),
		POLAR_CLIENT_ID: z.string().min(1).optional(),
		POLAR_CLIENT_SECRET: z.string().min(1).optional(),
		RAILWAY_CLIENT_ID: z.string().min(1).optional(),
		RAILWAY_CLIENT_SECRET: z.string().min(1).optional(),
		REDDIT_CLIENT_ID: z.string().min(1).optional(),
		REDDIT_CLIENT_SECRET: z.string().min(1).optional(),
		ROBLOX_CLIENT_ID: z.string().min(1).optional(),
		ROBLOX_CLIENT_SECRET: z.string().min(1).optional(),
		SALESFORCE_CLIENT_ID: z.string().min(1).optional(),
		SALESFORCE_CLIENT_SECRET: z.string().min(1).optional(),
		SALESFORCE_ENVIRONMENT: z.enum(["sandbox", "production"]).optional(),
		SLACK_CLIENT_ID: z.string().min(1).optional(),
		SLACK_CLIENT_SECRET: z.string().min(1).optional(),
		SPOTIFY_CLIENT_ID: z.string().min(1).optional(),
		SPOTIFY_CLIENT_SECRET: z.string().min(1).optional(),
		TIKTOK_CLIENT_KEY: z.string().min(1).optional(),
		TIKTOK_CLIENT_SECRET: z.string().min(1).optional(),
		TWITCH_CLIENT_ID: z.string().min(1).optional(),
		TWITCH_CLIENT_SECRET: z.string().min(1).optional(),
		TWITTER_CLIENT_ID: z.string().min(1).optional(),
		TWITTER_CLIENT_SECRET: z.string().min(1).optional(),
		VERCEL_CLIENT_ID: z.string().min(1).optional(),
		VERCEL_CLIENT_SECRET: z.string().min(1).optional(),
		VK_CLIENT_ID: z.string().min(1).optional(),
		VK_CLIENT_SECRET: z.string().min(1).optional(),
		WECHAT_CLIENT_ID: z.string().min(1).optional(),
		WECHAT_CLIENT_SECRET: z.string().min(1).optional(),
		ZOOM_CLIENT_ID: z.string().min(1).optional(),
		ZOOM_CLIENT_SECRET: z.string().min(1).optional(),
	},
	clientPrefix: "NEXT_PUBLIC_",
	client: {},
	env: process.env,
	skip: process.env.SKIP_ENV_VALIDATION === "true",
	onError: (issues) => {
		console.error("Invalid environment variables:", issues);
		process.exit(1);
	},
	onInvalidAccess: (variable) => {
		throw new Error(
			`Attempted to access server variable "${variable}" on the client`,
		);
	},
});

export default env;
