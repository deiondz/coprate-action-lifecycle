import { DrishtiClient, type DrishtiWebSocketSession } from "drishti-sdk";

import {
	isCorporateActionAnnouncement,
	type SourceAnnouncement,
} from "./domain";

export type SymbolIdentity = {
	symbol: string;
	companyName: string;
	companyLogo?: string;
};

export interface MarketDataSource {
	resolveSymbol(symbol: string): Promise<SymbolIdentity | undefined>;
	listAnnouncements(symbol: string): Promise<SourceAnnouncement[]>;
	openStream(
		symbols: string[],
		onAnnouncement: (announcement: SourceAnnouncement) => Promise<void>,
		onReconnect: () => void,
	): Promise<{ close(): Promise<void>; connected(): boolean }>;
	getSourceDocument(id: string): Promise<Response>;
}

export class DrishtiMarketDataSource implements MarketDataSource {
	private readonly client: DrishtiClient;
	private readonly apiKey: string;

	constructor(options: { apiKey: string; fetchImpl?: typeof fetch }) {
		this.apiKey = options.apiKey;
		this.client = new DrishtiClient({
			apiKey: options.apiKey,
			fetchImpl: options.fetchImpl,
			retry: { maxRetries: 3 },
		});
	}

	async resolveSymbol(symbol: string): Promise<SymbolIdentity | undefined> {
		const response = await this.client.getSymbolsMetadata({
			symbols: [symbol],
		});
		const row = response.data.find(
			(item) => item.symbol.toUpperCase() === symbol.toUpperCase(),
		);
		return row
			? {
					symbol: row.symbol.toUpperCase(),
					companyName: row.company_name ?? row.symbol,
					companyLogo: row.logo ?? undefined,
				}
			: undefined;
	}

	async listAnnouncements(symbol: string): Promise<SourceAnnouncement[]> {
		const result: SourceAnnouncement[] = [];
		for (let page = 1; ; page += 1) {
			const response = await this.client.getAnnouncements({
				symbols: [symbol],
				detailed: true,
				page,
				limit: 50,
			});
			const announcements = response.data.map(normalizeAnnouncement);
			result.push(...announcements);
			if (
				announcements.some(isCorporateActionAnnouncement) ||
				!response.has_next ||
				announcements.length === 0
			) {
				break;
			}
		}
		return result;
	}

	async openStream(
		symbols: string[],
		onAnnouncement: (announcement: SourceAnnouncement) => Promise<void>,
		onReconnect: () => void,
	): Promise<{ close(): Promise<void>; connected(): boolean }> {
		let opened = false;
		const session: DrishtiWebSocketSession = this.client.websocket({
			onOpen: () => {
				if (opened) onReconnect();
				opened = true;
			},
			onAnnouncements: async (row) => {
				await onAnnouncement(normalizeAnnouncement(row));
			},
			reconnectInitialDelayMs: 1_000,
			reconnectMaxDelayMs: 30_000,
		});
		await session.subscribe({
			product: "announcements",
			symbols,
			detailed: true,
		});
		return {
			close: () => session.close(),
			connected: () => session.connected,
		};
	}

	async getSourceDocument(id: string): Promise<Response> {
		const response = await fetch(
			`https://developers.manasija.in/v1/announcements/citations/${encodeURIComponent(id)}/pdf`,
			{ headers: { "X-API-Key": this.apiKey } },
		);
		if (
			!response.ok ||
			!response.headers.get("Content-Type")?.includes("text/html")
		)
			return response;

		const html = await response.text();
		const redirectPath = html.match(
			/window\.location\.replace\(["']([^"']+)["']\)/,
		)?.[1];
		if (!redirectPath)
			return new Response(null, {
				status: 502,
				statusText: "Invalid citation",
			});

		const target = new URL(redirectPath, "https://developers.manasija.in");
		if (
			target.origin !== "https://developers.manasija.in" ||
			target.pathname !== "/v1/citations/file"
		) {
			return new Response(null, {
				status: 502,
				statusText: "Invalid citation",
			});
		}
		return fetch(target);
	}
}

function normalizeAnnouncement(value: unknown): SourceAnnouncement {
	const row = asRecord(value);
	const id = requiredString(row.id, "announcement id");
	const symbol = requiredString(
		row.symbol,
		"announcement symbol",
	).toUpperCase();
	return {
		id,
		symbol,
		companyName: stringValue(row.company_name) ?? symbol,
		image: stringValue(row.image),
		date: normalizeDate(row.date),
		headline:
			stringValue(row.headline) ??
			stringValue(row.title) ??
			stringValue(row.summary) ??
			stringValue(row.category) ??
			"Corporate announcement",
		summary: stringValue(row.summary),
		longSummary: stringValue(row.long_summary),
		category: stringValue(row.category) ?? "Corporate Announcement",
		relatedCategories: stringArray(row.related_categories),
		descriptor: stringValue(row.descriptor),
		exchange: stringValue(row.exchange) ?? "NSE/BSE",
		important: typeof row.important === "boolean" ? row.important : undefined,
		extractedInformation: row.extracted_information,
		rawData: value,
	};
}

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function stringValue(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];
}

function requiredString(value: unknown, label: string): string {
	const normalized = stringValue(value);
	if (!normalized) throw new Error(`Drishti returned an invalid ${label}`);
	return normalized;
}

function normalizeDate(value: unknown): string {
	const date = new Date(stringValue(value) ?? "");
	return Number.isNaN(date.getTime())
		? new Date().toISOString()
		: date.toISOString();
}
