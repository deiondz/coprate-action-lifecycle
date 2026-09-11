import type {
	CorporateActionLifecycle,
	LifecycleListResponse,
	LifecycleSummary,
	WatchlistSymbol,
} from "@lifecycle/contracts";

import { buildLifecycles, type SourceAnnouncement } from "./domain";
import type { MarketDataSource } from "./market-data";
import type { LifecycleRepository } from "./repository";

type StreamHandle = { close(): Promise<void>; connected(): boolean };

export class LifecycleService {
	private stream?: StreamHandle;
	private restartingStream?: Promise<void>;
	private readonly syncs = new Map<
		string,
		Promise<CorporateActionLifecycle[]>
	>();
	private readonly ingests = new Map<string, Promise<void>>();
	private readonly removingSymbols = new Set<string>();

	constructor(
		readonly repository: LifecycleRepository,
		private readonly market?: MarketDataSource,
	) {}

	async start(): Promise<void> {
		if (!this.market) return;
		await this.syncAll();
		await this.restartStream();
	}

	async stop(): Promise<void> {
		await this.stream?.close();
		this.stream = undefined;
	}

	listSymbols(): Promise<WatchlistSymbol[]> {
		return this.repository.listSymbols();
	}

	async addSymbol(input: string): Promise<WatchlistSymbol> {
		if (!this.market) throw new ServiceUnavailableError();
		const symbol = normalizeSymbol(input);
		const identity = await this.market.resolveSymbol(symbol);
		if (!identity) throw new UnknownSymbolError(symbol);
		this.removingSymbols.delete(identity.symbol);
		const saved = await this.repository.addSymbol(
			identity.symbol,
			identity.companyName,
			identity.companyLogo,
		);
		await this.syncSymbol(identity.symbol);
		void this.restartStream();
		return (await this.repository.getSymbol(identity.symbol)) ?? saved;
	}

	async removeSymbol(input: string): Promise<boolean> {
		const symbol = normalizeSymbol(input);
		this.removingSymbols.add(symbol);
		const operations: Promise<unknown>[] = [];
		const sync = this.syncs.get(symbol);
		const ingest = this.ingests.get(symbol);
		if (sync) operations.push(sync);
		if (ingest) operations.push(ingest);
		await Promise.allSettled(operations);
		const removed = await this.repository.removeSymbol(symbol);
		if (removed) void this.restartStream();
		return removed;
	}

	async listLifecycles(): Promise<LifecycleListResponse> {
		const data = await this.repository.listLifecycles();
		return {
			data,
			summary: summarize(data),
			stream: this.streamStatus(),
		};
	}

	streamStatus(): LifecycleListResponse["stream"] {
		return !this.market
			? "not_configured"
			: this.stream?.connected()
				? "connected"
				: "disconnected";
	}

	getLifecycle(id: string): Promise<CorporateActionLifecycle | undefined> {
		return this.repository.getLifecycle(id);
	}

	async getSourceDocument(id: string): Promise<Response> {
		if (!this.market) throw new ServiceUnavailableError();
		if (!(await this.repository.hasAnnouncement(id)))
			return new Response(null, { status: 404 });
		return this.market.getSourceDocument(id);
	}

	async syncAll(): Promise<void> {
		const symbols = await this.repository.listSymbols();
		await Promise.allSettled(
			symbols.map((item) => this.syncSymbol(item.symbol)),
		);
	}

	async syncSymbol(symbol: string): Promise<CorporateActionLifecycle[]> {
		if (!this.market) throw new ServiceUnavailableError();
		const normalized = normalizeSymbol(symbol);
		if (this.removingSymbols.has(normalized)) return [];
		if (!(await this.repository.getSymbol(normalized)))
			throw new UnknownSymbolError(normalized);
		const pending = this.syncs.get(normalized);
		if (pending) return pending;

		const sync = this.performSync(normalized).finally(() => {
			this.syncs.delete(normalized);
		});
		this.syncs.set(normalized, sync);
		return sync;
	}

	private async performSync(
		symbol: string,
	): Promise<CorporateActionLifecycle[]> {
		try {
			let watched = await this.repository.getSymbol(symbol);
			if (!watched?.companyLogo) {
				const identity = await this.market?.resolveSymbol(symbol);
				if (identity) {
					watched = await this.repository.addSymbol(
						identity.symbol,
						identity.companyName,
						identity.companyLogo,
					);
				}
			}
			const announcements = (await this.market?.listAnnouncements(symbol))?.map(
				(announcement) => ({
					...announcement,
					companyLogo: announcement.companyLogo ?? watched?.companyLogo,
				}),
			);
			if (this.removingSymbols.has(symbol)) return [];
			await this.repository.upsertAnnouncements(announcements ?? []);
			const lifecycles = buildLifecycles(
				await this.repository.listAnnouncements(symbol),
			);
			await this.repository.replaceLifecycles(symbol, lifecycles);
			await this.repository.setSyncResult(symbol);
			return lifecycles;
		} catch (error) {
			await this.repository.setSyncResult(symbol, publicError(error));
			throw error;
		}
	}

	private ingestAnnouncement(announcement: SourceAnnouncement): Promise<void> {
		const previous = this.ingests.get(announcement.symbol) ?? Promise.resolve();
		const next = previous
			.catch(() => undefined)
			.then(() => this.performIngest(announcement))
			.finally(() => {
				if (this.ingests.get(announcement.symbol) === next)
					this.ingests.delete(announcement.symbol);
			});
		this.ingests.set(announcement.symbol, next);
		return next;
	}

	private async performIngest(announcement: SourceAnnouncement): Promise<void> {
		if (this.removingSymbols.has(announcement.symbol)) return;
		const watched = await this.repository.getSymbol(announcement.symbol);
		if (!watched) return;
		await this.repository.upsertAnnouncements([
			{
				...announcement,
				companyLogo: announcement.companyLogo ?? watched.companyLogo,
			},
		]);
		await this.repository.replaceLifecycles(
			announcement.symbol,
			buildLifecycles(
				await this.repository.listAnnouncements(announcement.symbol),
			),
		);
		await this.repository.setSyncResult(announcement.symbol);
	}

	private async restartStream(): Promise<void> {
		if (!this.market) return;
		if (this.restartingStream) return this.restartingStream;
		this.restartingStream = this.performRestart().finally(() => {
			this.restartingStream = undefined;
		});
		return this.restartingStream;
	}

	private async performRestart(): Promise<void> {
		await this.stream?.close();
		this.stream = undefined;
		const symbols = (await this.repository.listSymbols()).map(
			(item) => item.symbol,
		);
		if (symbols.length === 0) return;
		this.stream = await this.market?.openStream(
			symbols,
			(announcement) => this.ingestAnnouncement(announcement),
			() => void this.syncAll(),
		);
	}
}

export class UnknownSymbolError extends Error {
	constructor(symbol: string) {
		super(`No listed company was found for ${symbol}.`);
	}
}

export class ServiceUnavailableError extends Error {
	constructor() {
		super("Drishti is not configured. Set DRISHTI_API_KEY on the backend.");
	}
}

export function normalizeSymbol(value: string): string {
	const symbol = value.trim().toUpperCase();
	if (!/^[A-Z0-9&.-]{1,24}$/.test(symbol)) {
		throw new Error("Enter a valid NSE or BSE symbol.");
	}
	return symbol;
}

function summarize(data: CorporateActionLifecycle[]): LifecycleSummary {
	const today = new Date().toISOString().slice(0, 10);
	return data.reduce<LifecycleSummary>(
		(summary, item) => {
			if (item.state === "active") summary.active += 1;
			if (item.state === "completed") summary.completed += 1;
			if (item.state === "needs_review") summary.needsReview += 1;
			if (item.updatedAt.slice(0, 10) === today) summary.updatedToday += 1;
			if (item.nextExpectedDate) summary.upcomingDates += 1;
			return summary;
		},
		{
			active: 0,
			upcomingDates: 0,
			updatedToday: 0,
			completed: 0,
			needsReview: 0,
		},
	);
}

function publicError(error: unknown): string {
	return error instanceof Error ? "Sync failed. Try again." : "Sync failed.";
}
