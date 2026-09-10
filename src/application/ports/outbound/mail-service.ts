export type SendMailInput = {
	to: { address: string; name?: string };
	subject: string;
	html: string;
	text: string;
	replyTo?: { address: string; name?: string };
};

export interface MailService {
	send(input: SendMailInput): Promise<void>;
}
