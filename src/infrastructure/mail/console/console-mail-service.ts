import "server-only";

import type {
	MailService,
	SendMailInput,
} from "@/application/ports/outbound/mail-service";

const URL_PATTERN = /https?:\/\/[^\s"'<>]+/i;
const BODY_PREVIEW_LENGTH = 280;

function extractLink(text: string, html: string): string | undefined {
	return text.match(URL_PATTERN)?.[0] ?? html.match(URL_PATTERN)?.[0];
}

function truncate(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value;
	}
	return `${value.slice(0, maxLength)}…`;
}

export class ConsoleMailService implements MailService {
	async send(input: SendMailInput): Promise<void> {
		const link = extractLink(input.text, input.html);
		const preview = truncate(input.text || input.html, BODY_PREVIEW_LENGTH);

		console.info("[mail:console] Outbound email (ZeptoMail not configured)");
		console.info(`[mail:console] to: ${input.to.address}`);
		console.info(`[mail:console] subject: ${input.subject}`);
		if (link) {
			console.info(`[mail:console] link: ${link}`);
		}
		console.info(`[mail:console] body: ${preview}`);
	}
}
