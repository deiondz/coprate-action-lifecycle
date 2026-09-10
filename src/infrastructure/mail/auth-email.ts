import "server-only";

import env from "@/../env.config";
import { getMailService } from "@/composition/mail-container";
import {
	renderMagicLinkEmail,
	renderResetPasswordEmail,
	renderVerificationEmail,
} from "@/infrastructure/mail/templates/auth-emails";

type AuthEmailUser = {
	email: string;
	name?: string | null;
};

type SendAuthEmailInput =
	| {
			kind: "verification";
			user: AuthEmailUser;
			url: string;
	  }
	| {
			kind: "reset-password";
			user: AuthEmailUser;
			url: string;
	  }
	| {
			kind: "magic-link";
			email: string;
			url: string;
	  };

const subjects = {
	verification: (appName: string) => `Verify your email for ${appName}`,
	"reset-password": (appName: string) => `Reset your ${appName} password`,
	"magic-link": (appName: string) => `Sign in to ${appName}`,
} as const;

export async function sendAuthEmail(input: SendAuthEmailInput): Promise<void> {
	const appName = env.APP_NAME;
	const mail = getMailService();

	if (input.kind === "verification") {
		const { html, text } = await renderVerificationEmail({
			url: input.url,
			email: input.user.email,
			appName,
		});

		await mail.send({
			to: {
				address: input.user.email,
				...(input.user.name ? { name: input.user.name } : {}),
			},
			subject: subjects.verification(appName),
			html,
			text,
		});
		return;
	}

	if (input.kind === "reset-password") {
		const { html, text } = await renderResetPasswordEmail({
			url: input.url,
			email: input.user.email,
			appName,
		});

		await mail.send({
			to: {
				address: input.user.email,
				...(input.user.name ? { name: input.user.name } : {}),
			},
			subject: subjects["reset-password"](appName),
			html,
			text,
		});
		return;
	}

	const { html, text } = await renderMagicLinkEmail({
		url: input.url,
		email: input.email,
		appName,
	});

	await mail.send({
		to: { address: input.email },
		subject: subjects["magic-link"](appName),
		html,
		text,
	});
}
