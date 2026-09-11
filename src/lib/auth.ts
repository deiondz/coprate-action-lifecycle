import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { magicLink, multiSession } from "better-auth/plugins";
import { after } from "next/server";

import env from "../../env.config";
import { getAuthDatabaseAdapter } from "../composition/auth-database-container";
import { sendAuthEmail } from "../infrastructure/mail/auth-email";
import { getSocialProviders } from "./auth-social-providers";
import { isZeptoMailConfigured } from "./email-delivery";

const emailDeliveryEnabled = isZeptoMailConfigured();

export const auth = betterAuth({
	appName: env.APP_NAME,
	database: getAuthDatabaseAdapter(),
	...(env.BETTER_AUTH_URL ? { baseURL: env.BETTER_AUTH_URL } : {}),
	advanced: {
		backgroundTasks: {
			handler: (promise) => {
				after(async () => {
					await promise;
				});
			},
		},
	},
	...(emailDeliveryEnabled
		? {
				emailVerification: {
					sendOnSignUp: true,
					sendVerificationEmail: async ({ user, url }) => {
						void sendAuthEmail({ kind: "verification", user, url });
					},
				},
			}
		: {}),
	emailAndPassword: {
		// Credential auth must not depend on transactional email. Delivery is
		// only required for verification and password-recovery flows below.
		enabled: true,
		requireEmailVerification: emailDeliveryEnabled,
		...(emailDeliveryEnabled
			? {
					sendResetPassword: async ({ user, url }) => {
						void sendAuthEmail({ kind: "reset-password", user, url });
					},
				}
			: {}),
	},
	secret: env.BETTER_AUTH_SECRET,
	plugins: [
		multiSession(),
		...(emailDeliveryEnabled
			? [
					magicLink({
						sendMagicLink: async ({ email, url }) => {
							void sendAuthEmail({ kind: "magic-link", email, url });
						},
					}),
				]
			: []),
		passkey(),
	],
	user: {
		deleteUser: {
			enabled: true,
		},
	},
	socialProviders: getSocialProviders(),
});
