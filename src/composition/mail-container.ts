import "server-only";

import env from "@/../env.config";
import type { MailService } from "@/application/ports/outbound/mail-service";
import { ConsoleMailService } from "@/infrastructure/mail/console/console-mail-service";
import { ZeptoMailMailService } from "@/infrastructure/mail/zeptomail/zeptomail-mail-service";

let mailService: MailService | undefined;
let didWarnConsoleFallback = false;

function createMailService(): MailService {
	const token = env.ZEPTOMAIL_TOKEN;
	const fromEmail = env.ZEPTOMAIL_FROM_EMAIL;

	if (token && fromEmail) {
		return new ZeptoMailMailService({
			token,
			fromEmail,
			fromName: env.ZEPTOMAIL_FROM_NAME,
		});
	}

	if (env.NODE_ENV === "development" && !didWarnConsoleFallback) {
		didWarnConsoleFallback = true;
		console.warn(
			"[mail] ZEPTOMAIL_TOKEN / ZEPTOMAIL_FROM_EMAIL not set — using ConsoleMailService. Emails are logged, not sent.",
		);
	}

	return new ConsoleMailService();
}

export function getMailService(): MailService {
	mailService ??= createMailService();
	return mailService;
}
