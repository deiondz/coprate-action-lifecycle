import type {
	SocialProvider,
	SocialProviders,
} from "better-auth/social-providers";

type RuntimeProviderConfig = Record<string, string | boolean | undefined>;
type RuntimeSocialProviders = Partial<
	Record<SocialProvider, RuntimeProviderConfig>
>;

const CLIENT_CREDENTIAL_PROVIDERS = [
	"apple",
	"atlassian",
	"discord",
	"dropbox",
	"facebook",
	"figma",
	"github",
	"gitlab",
	"google",
	"huggingface",
	"kakao",
	"kick",
	"line",
	"linear",
	"linkedin",
	"microsoft",
	"naver",
	"notion",
	"paybin",
	"paypal",
	"polar",
	"railway",
	"reddit",
	"roblox",
	"salesforce",
	"slack",
	"spotify",
	"twitch",
	"twitter",
	"vercel",
	"vk",
	"wechat",
	"zoom",
] as const satisfies readonly SocialProvider[];

type ClientCredentialProvider = (typeof CLIENT_CREDENTIAL_PROVIDERS)[number];

const PROVIDER_ENV_PREFIXES = {
	apple: "APPLE",
	atlassian: "ATLASSIAN",
	cognito: "COGNITO",
	discord: "DISCORD",
	dropbox: "DROPBOX",
	facebook: "FACEBOOK",
	figma: "FIGMA",
	github: "GITHUB",
	gitlab: "GITLAB",
	google: "GOOGLE",
	huggingface: "HUGGINGFACE",
	kakao: "KAKAO",
	kick: "KICK",
	line: "LINE",
	linear: "LINEAR",
	linkedin: "LINKEDIN",
	microsoft: "MICROSOFT",
	naver: "NAVER",
	notion: "NOTION",
	paybin: "PAYBIN",
	paypal: "PAYPAL",
	polar: "POLAR",
	railway: "RAILWAY",
	reddit: "REDDIT",
	roblox: "ROBLOX",
	salesforce: "SALESFORCE",
	slack: "SLACK",
	spotify: "SPOTIFY",
	tiktok: "TIKTOK",
	twitch: "TWITCH",
	twitter: "TWITTER",
	vercel: "VERCEL",
	vk: "VK",
	wechat: "WECHAT",
	zoom: "ZOOM",
} as const satisfies Record<SocialProvider, string>;

function getEnv(name: string) {
	const value = process.env[name]?.trim();
	return value ? value : undefined;
}

function getBooleanEnv(name: string) {
	const value = getEnv(name);
	if (!value) return undefined;
	return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function getClientCredentials(provider: ClientCredentialProvider) {
	const prefix = PROVIDER_ENV_PREFIXES[provider];
	const clientId = getEnv(`${prefix}_CLIENT_ID`);
	const clientSecret = getEnv(`${prefix}_CLIENT_SECRET`);

	if (!clientId || !clientSecret) return undefined;
	return { clientId, clientSecret };
}

export function getEnabledSocialProviderIds() {
	return Object.keys(getSocialProviders()) as SocialProvider[];
}

export function getSocialProviders() {
	const socialProviders: RuntimeSocialProviders = {};

	for (const provider of CLIENT_CREDENTIAL_PROVIDERS) {
		const credentials = getClientCredentials(provider);
		if (!credentials) continue;

		socialProviders[provider] = {
			...credentials,
			...(provider === "gitlab" && getEnv("GITLAB_ISSUER")
				? { issuer: getEnv("GITLAB_ISSUER") }
				: {}),
			...(provider === "microsoft" && getEnv("MICROSOFT_TENANT_ID")
				? { tenantId: getEnv("MICROSOFT_TENANT_ID") }
				: {}),
			...(provider === "microsoft" && getEnv("MICROSOFT_AUTHORITY")
				? { authority: getEnv("MICROSOFT_AUTHORITY") }
				: {}),
			...(provider === "paybin" && getEnv("PAYBIN_ISSUER")
				? { issuer: getEnv("PAYBIN_ISSUER") }
				: {}),
			...(provider === "paypal" && getEnv("PAYPAL_ENVIRONMENT")
				? { environment: getEnv("PAYPAL_ENVIRONMENT") }
				: {}),
			...(provider === "salesforce" && getEnv("SALESFORCE_ENVIRONMENT")
				? { environment: getEnv("SALESFORCE_ENVIRONMENT") }
				: {}),
		};
	}

	const cognito = getCognitoProvider();
	if (cognito) {
		socialProviders.cognito = cognito;
	}

	const tiktok = getTiktokProvider();
	if (tiktok) {
		socialProviders.tiktok = tiktok;
	}

	return socialProviders as SocialProviders;
}

function getCognitoProvider() {
	const clientId = getEnv("COGNITO_CLIENT_ID");
	const domain = getEnv("COGNITO_DOMAIN");
	const region = getEnv("COGNITO_REGION");
	const userPoolId = getEnv("COGNITO_USER_POOL_ID");

	if (!clientId || !domain || !region || !userPoolId) return undefined;

	return {
		clientId,
		domain,
		region,
		userPoolId,
		clientSecret: getEnv("COGNITO_CLIENT_SECRET"),
		requireClientSecret: getBooleanEnv("COGNITO_REQUIRE_CLIENT_SECRET"),
	};
}

function getTiktokProvider() {
	const clientKey = getEnv("TIKTOK_CLIENT_KEY");
	const clientSecret = getEnv("TIKTOK_CLIENT_SECRET");

	if (!clientKey || !clientSecret) return undefined;
	return { clientKey, clientSecret };
}
