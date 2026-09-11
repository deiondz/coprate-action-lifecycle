import { describe, expect, test } from "bun:test";

import { DrishtiMarketDataSource } from "../src/market-data";

type AnnouncementPage = {
	data: Array<{
		id: string;
		symbol: string;
		date: string;
		category: string;
		related_categories?: string[];
	}>;
	has_next: boolean;
};

function marketWithPages(pages: AnnouncementPage[], requestedPages: number[]) {
	const fetchImpl = Object.assign(
		async (input: RequestInfo | URL) => {
			const url = new URL(String(input));
			const page = Number(url.searchParams.get("page"));
			requestedPages.push(page);
			return Response.json(pages[page - 1]);
		},
		{ preconnect: (_url: string | URL) => undefined },
	);

	return new DrishtiMarketDataSource({
		apiKey: "test-key",
		fetchImpl,
	});
}

describe("Drishti announcement backfill", () => {
	test("fetches backward until the first page containing a corporate action", async () => {
		const requestedPages: number[] = [];
		const market = marketWithPages(
			[
				{
					data: [
						{
							id: "recent-general",
							symbol: "TCS",
							date: "2026-09-09T10:00:00Z",
							category: "General Update",
						},
					],
					has_next: true,
				},
				{
					data: [
						{
							id: "last-corporate-action",
							symbol: "TCS",
							date: "2026-07-09T10:00:00Z",
							category: "Outcome of Board Meeting",
							related_categories: ["Dividend"],
						},
					],
					has_next: true,
				},
				{
					data: [
						{
							id: "older-general",
							symbol: "TCS",
							date: "2026-05-01T10:00:00Z",
							category: "General Update",
						},
					],
					has_next: false,
				},
			],
			requestedPages,
		);

		const announcements = await market.listAnnouncements("TCS");

		expect(requestedPages).toEqual([1, 2]);
		expect(announcements.map((item) => item.id)).toEqual([
			"recent-general",
			"last-corporate-action",
		]);
	});

	test("continues to the final page when no corporate action exists", async () => {
		const requestedPages: number[] = [];
		const market = marketWithPages(
			[
				{
					data: [
						{
							id: "general-1",
							symbol: "TCS",
							date: "2026-09-09T10:00:00Z",
							category: "General Update",
						},
					],
					has_next: true,
				},
				{
					data: [
						{
							id: "general-2",
							symbol: "TCS",
							date: "2026-08-01T10:00:00Z",
							category: "General Update",
						},
					],
					has_next: false,
				},
			],
			requestedPages,
		);

		const announcements = await market.listAnnouncements("TCS");

		expect(requestedPages).toEqual([1, 2]);
		expect(announcements).toHaveLength(2);
	});
});
