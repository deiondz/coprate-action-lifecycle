import { describe, expect, test } from "bun:test";

import { buildLifecycles, type SourceAnnouncement } from "../src/domain";

function announcement(
	id: string,
	date: string,
	headline: string,
	extractedInformation?: unknown,
): SourceAnnouncement {
	return {
		id,
		symbol: "RIGHTSCO",
		companyName: "Rights Company Ltd.",
		date,
		headline,
		category: "Rights Issue",
		relatedCategories: [],
		exchange: "BSE",
		extractedInformation,
	};
}

describe("corporate-action lifecycle engine", () => {
	test("groups disconnected rights-issue filings and detects a changed close date", () => {
		const result = buildLifecycles([
			announcement("a1", "2026-01-02T10:00:00Z", "Board approved rights issue"),
			announcement("a2", "2026-01-10T10:00:00Z", "Terms of rights issue", {
				rights_issue: {
					rights_ratio: "1:4",
					issue_price: 120,
					closing_date: "2026-02-15",
				},
			}),
			announcement(
				"a3",
				"2026-01-15T10:00:00Z",
				"Record date for rights entitlement",
				{
					rights_issue: { record_date: "2026-01-30" },
				},
			),
			announcement("a4", "2026-02-08T03:30:00Z", "Opening of rights issue"),
			announcement("a5", "2026-02-12T10:00:00Z", "Closing date extended", {
				rights_issue: { closing_date: "2026-02-18" },
			}),
		]);

		expect(result).toHaveLength(1);
		expect(result[0].status).toBe("Issue Open");
		expect(result[0].announcements).toHaveLength(5);
		expect(
			result[0].terms.find((term) => term.key === "rights_ratio")?.value,
		).toBe("1:4");
		expect(
			result[0].changes.find((change) => change.field === "closing_date"),
		).toMatchObject({
			title: "Closing date changed",
			previousValue: "15 Feb 2026",
			newValue: "18 Feb 2026",
			announcementId: "a5",
		});
	});

	test("keeps incomplete terms without fabricating values", () => {
		const [result] = buildLifecycles([
			announcement(
				"a1",
				"2026-01-02T10:00:00Z",
				"Board approved rights issue",
				{
					rights_issue: { issue_price: null, rights_ratio: "1:5" },
				},
			),
		]);

		expect(result.terms.map((term) => term.key)).toEqual(["rights_ratio"]);
		expect(result.nextExpectedDate).toBeUndefined();
	});

	test("marks an event as review-only when two lifecycles are plausible", () => {
		const result = buildLifecycles([
			announcement("a1", "2026-01-01T10:00:00Z", "Rights issue record date", {
				rights_issue: { record_date: "2026-01-15" },
			}),
			announcement("a2", "2026-03-01T10:00:00Z", "Rights issue record date", {
				rights_issue: { record_date: "2026-03-15" },
			}),
			announcement("a3", "2026-04-01T10:00:00Z", "Update to rights issue"),
		]);

		expect(result).toHaveLength(3);
		expect(
			result.find((item) => item.announcements[0].id === "a3"),
		).toMatchObject({
			state: "needs_review",
		});
	});
});
