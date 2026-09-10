import "server-only";

import {
	EmailVerificationEmail,
	MagicLinkEmail,
	ResetPasswordEmail,
} from "@better-auth-ui/react/email";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

import env from "@/../env.config";

export type RenderedEmail = {
	html: string;
	text: string;
};

type AuthEmailTemplateProps = {
	url: string;
	email?: string;
	appName?: string;
	expirationMinutes?: number;
};

async function renderEmail(element: ReactElement): Promise<RenderedEmail> {
	const [html, text] = await Promise.all([
		render(element),
		render(element, { plainText: true }),
	]);

	return { html, text };
}

function resolveAppName(appName?: string): string {
	return appName ?? env.APP_NAME;
}

export async function renderVerificationEmail(
	props: AuthEmailTemplateProps,
): Promise<RenderedEmail> {
	return renderEmail(
		<EmailVerificationEmail
			url={props.url}
			email={props.email}
			appName={resolveAppName(props.appName)}
			expirationMinutes={props.expirationMinutes}
		/>,
	);
}

export async function renderResetPasswordEmail(
	props: AuthEmailTemplateProps,
): Promise<RenderedEmail> {
	return renderEmail(
		<ResetPasswordEmail
			url={props.url}
			email={props.email}
			appName={resolveAppName(props.appName)}
			expirationMinutes={props.expirationMinutes}
		/>,
	);
}

export async function renderMagicLinkEmail(
	props: AuthEmailTemplateProps,
): Promise<RenderedEmail> {
	return renderEmail(
		<MagicLinkEmail
			url={props.url}
			email={props.email}
			appName={resolveAppName(props.appName)}
			expirationMinutes={props.expirationMinutes}
		/>,
	);
}
