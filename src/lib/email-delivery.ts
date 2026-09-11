import "server-only";

import env from "@/../env.config";

/**
 * Auth email flows are available only when ZeptoMail can actually deliver them.
 */
export function isZeptoMailConfigured(): boolean {
	return Boolean(env.ZEPTOMAIL_TOKEN && env.ZEPTOMAIL_FROM_EMAIL);
}
