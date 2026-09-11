export const ACTION_TYPES = [
	"Dividend",
	"Bonus Issue",
	"Stock Split",
	"Rights Issue",
	"Buyback",
	"Issue of Securities",
	"Conversion of Warrants",
	"Offer for Sale",
	"Redemption of Securities",
	"Merger",
	"Demerger",
	"De-listing",
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];
export type LifecycleState =
	| "active"
	| "completed"
	| "cancelled"
	| "needs_review";
export type StageStatus =
	| "completed"
	| "current"
	| "pending"
	| "skipped"
	| "cancelled";
export type DateCertainty = "confirmed" | "expected" | "estimated";

export type LifecycleStage = {
	id: string;
	label: string;
	status: StageStatus;
	date?: string;
	dateCertainty?: DateCertainty;
	announcementIds?: string[];
};

export type LifecycleChange = {
	id: string;
	timestamp: string;
	type:
		| "state_change"
		| "field_change"
		| "new_date"
		| "cancelled"
		| "completed";
	title: string;
	description?: string;
	field?: string;
	previousValue?: string;
	newValue?: string;
	announcementId: string;
};

export type AnnouncementReference = {
	id: string;
	date: string;
	headline: string;
	exchange: string;
	category: string;
	relatedCategories: string[];
	descriptor?: string;
	summary?: string;
	longSummary?: string;
	important?: boolean;
	image?: string;
	extractedInformation?: unknown;
	rawData?: unknown;
	sourceUrl: string;
};

export type LifecycleTerm = {
	key: string;
	label: string;
	value: string;
	certainty?: DateCertainty;
	announcementId: string;
};

export type CorporateActionLifecycle = {
	id: string;
	symbol: string;
	companyName: string;
	companyLogo?: string;
	actionType: ActionType;
	summary: string;
	status: string;
	state: LifecycleState;
	createdAt: string;
	updatedAt: string;
	terms: LifecycleTerm[];
	stages: LifecycleStage[];
	changes: LifecycleChange[];
	announcements: AnnouncementReference[];
	nextExpectedStage?: string;
	nextExpectedDate?: string;
};

export type WatchlistSymbol = {
	symbol: string;
	companyName: string;
	companyLogo?: string;
	addedAt: string;
	lastSyncedAt?: string;
	syncError?: string;
};

export type LifecycleSummary = {
	active: number;
	upcomingDates: number;
	updatedToday: number;
	completed: number;
	needsReview: number;
};

export type LifecycleListResponse = {
	data: CorporateActionLifecycle[];
	summary: LifecycleSummary;
	stream: "connected" | "disconnected" | "not_configured";
};

export type ApiError = { error: string };
