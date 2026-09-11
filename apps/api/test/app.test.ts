import { describe, expect, test } from "bun:test";

import { createApp } from "../src/app";
import type { SourceAnnouncement } from "../src/domain";
import { LifecycleService } from "../src/lifecycle-service";
import type { MarketDataSource, SymbolIdentity } from "../src/market-data";
import { MemoryLifecycleRepository } from "./memory-repository";

class FakeMarketData implements MarketDataSource {
	readonly announcements: SourceAnnouncement[] = [
		{
			id: "tcs-dividend-1",
			symbol: "TCS",
			companyName: "Tata Consultancy Services Ltd.",
			date: "2026-07-09T10:32:27.264Z",
			headline: "Board approves interim dividend and record date",
			category: "Dividend",
			relatedCategories: ["Outcome of Board Meeting"],
			exchange: "NSE",
			extractedInformation: {
				dividend: {
					dividend_amount_rs_per_share: 12,
					record_date: "2026-07-15",
					ex_date: "2026-07-14",
				},
			},
		},
	];

	async resolveSymbol(symbol: string): Promise<SymbolIdentity | undefined> {
		return symbol === "TCS"
			? { symbol: "TCS", companyName: "Tata Consultancy Services Ltd." }
			: undefined;
	}

	async listAnnouncements(): Promise<SourceAnnouncement[]> {
		return [...this.announcements, ...this.announcements];
	}

	async openStream(): Promise<{
		close(): Promise<void>;
		connected(): boolean;
	}> {
		return { close: async () => undefined, connected: () => true };
	}

	async getSourceDocument(): Promise<Response> {
		return new Response("pdf", {
			headers: { "Content-Type": "application/pdf" },
		});
	}
}

describe("Hono lifecycle API", () => {
	test("adds a validated symbol, syncs once per announcement id, and removes it", async () => {
		const repository = new MemoryLifecycleRepository();
		const service = new LifecycleService(repository, new FakeMarketData());
		const app = createApp(service);

		const add = await app.request("/api/symbols", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ symbol: "tcs" }),
		});
		expect(add.status).toBe(201);

		const lifecycles = await app.request("/api/lifecycles");
		const payload = await lifecycles.json();
		expect(payload.data).toHaveLength(1);
		expect(payload.data[0].announcements).toHaveLength(1);
		expect(payload.data[0]).toMatchObject({
			symbol: "TCS",
			actionType: "Dividend",
			status: "Record Date",
		});

		const remove = await app.request("/api/symbols/TCS", { method: "DELETE" });
		expect(remove.status).toBe(204);
		expect(await repository.listLifecycles()).toEqual([]);
	});

	test("rejects unknown symbols and reports an unconfigured Drishti backend", async () => {
		const repository = new MemoryLifecycleRepository();
		const configured = createApp(
			new LifecycleService(repository, new FakeMarketData()),
		);
		const unknown = await configured.request("/api/symbols", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ symbol: "NOPE" }),
		});
		expect(unknown.status).toBe(404);

		const unconfigured = createApp(new LifecycleService(repository));
		const unavailable = await unconfigured.request("/api/symbols", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ symbol: "TCS" }),
		});
		expect(unavailable.status).toBe(503);
	});

	test("serves Scalar and the external OpenAPI contract", async () => {
		const app = createApp(
			new LifecycleService(new MemoryLifecycleRepository()),
		);
		const document = await app.request("/openapi.json");
		const spec = await document.json();
		expect(document.status).toBe(200);
		expect(spec.openapi).toBe("3.1.0");
		expect(spec.info.description).toContain("Track corporate actions");
		expect(spec.paths["/api/lifecycles"]).toBeDefined();
		expect(spec.paths["/api/lifecycles"].get.description).toContain(
			"watched symbols",
		);
		expect(
			spec.tags.every((tag: { description?: string }) => tag.description),
		).toBe(true);
		expect(JSON.stringify(spec)).not.toContain("matchConfidence");

		const docs = await app.request("/docs");
		expect(docs.status).toBe(200);
		expect(await docs.text()).toContain(
			"Drishti Corporate Action Lifecycle API",
		);
	});
});
