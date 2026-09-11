"use client";

import type {
	ApiError,
	CorporateActionLifecycle,
	LifecycleListResponse,
	WatchlistSymbol,
} from "@lifecycle/contracts";
import {
	ArrowRight,
	CaretRight,
	Check,
	FileText,
	MagnifyingGlass,
	Star,
	Trash,
} from "@phosphor-icons/react/dist/ssr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PopButton } from "@/components/pop-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FILTERS = [
	"All",
	"Updated today",
	"Rights issues",
	"Dividends",
	"Needs review",
] as const;
const EMPTY_LIFECYCLES: CorporateActionLifecycle[] = [];

function useErrorToast(error: Error | null, id: string): void {
	useEffect(() => {
		if (error) {
			toast.error(error.message, { id });
			return;
		}
		toast.dismiss(id);
	}, [error, id]);
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, init);
	if (!response.ok) {
		const payload = (await response
			.json()
			.catch(() => null)) as ApiError | null;
		throw new Error(payload?.error ?? `Request failed (${response.status})`);
	}
	return response.json() as Promise<T>;
}

function formatDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "Asia/Kolkata",
	}).format(date);
}

function relativeTime(value: string): string {
	const time = new Date(value).getTime();
	if (Number.isNaN(time)) return value;
	const minutes = Math.max(0, Math.round((Date.now() - time) / 60_000));
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return formatDate(value);
}

function humanizeKey(value: string): string {
	return value
		.replaceAll("_", " ")
		.replaceAll(".", " · ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function flattenEventData(
	value: unknown,
	path: string[] = [],
): Array<{ key: string; label: string; value: string }> {
	if (value == null || value === "") return [];
	if (Array.isArray(value)) {
		if (value.every((item) => item == null || typeof item !== "object")) {
			return [
				{
					key: path.join("."),
					label: humanizeKey(path.join(".")),
					value: value.filter((item) => item != null).join(", "),
				},
			];
		}
		return value.flatMap((item, index) =>
			flattenEventData(item, [...path, String(index + 1)]),
		);
	}
	if (typeof value === "object") {
		return Object.entries(value).flatMap(([key, nested]) =>
			flattenEventData(nested, [...path, key]),
		);
	}
	return [
		{
			key: path.join("."),
			label: humanizeKey(path.join(".")),
			value: typeof value === "boolean" ? (value ? "Yes" : "No") : String(value),
		},
	];
}

function formatRawData(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2) ?? String(value);
	} catch {
		return String(value);
	}
}

function CompanyLogo({
	logo,
	name,
	symbol,
	compact = false,
}: {
	logo?: string;
	name: string;
	symbol: string;
	compact?: boolean;
}) {
	const [failed, setFailed] = useState(false);
	useEffect(() => setFailed(false), [logo]);
	const size = compact ? "size-9 rounded-lg" : "size-12 rounded-[12px]";

	return (
		<div
			className={cn(
				"grid shrink-0 place-items-center overflow-hidden border border-hairline bg-sub font-medium text-ink-2",
				size,
				compact ? "text-[10px]" : "text-[12px]",
			)}
		>
			{logo && !failed ? (
				// biome-ignore lint/performance/noImgElement: Drishti returns arbitrary company-logo hosts that cannot be safely allowlisted ahead of time.
				<img
					src={logo}
					alt={`${name} logo`}
					className="size-full object-contain p-1.5"
					loading="lazy"
					referrerPolicy="no-referrer"
					onError={() => setFailed(true)}
				/>
			) : (
				<span aria-label={`${name} logo fallback`}>{symbol.slice(0, 3)}</span>
			)}
		</div>
	);
}

function StateBadge({ lifecycle }: { lifecycle: CorporateActionLifecycle }) {
	const tone =
		lifecycle.state === "needs_review"
			? "text-flag"
			: lifecycle.state === "completed"
				? "text-moss"
				: "text-interior-accent";
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 text-[11px] font-medium",
				tone,
			)}
		>
			<span className="size-1.5 rounded-full bg-current" />
			{lifecycle.status}
		</span>
	);
}

function ProgressRail({
	lifecycle,
	compact = false,
}: {
	lifecycle: CorporateActionLifecycle;
	compact?: boolean;
}) {
	return (
		<ol
			className={cn(
				"flex min-w-max items-start",
				compact ? "gap-0" : "gap-0.5",
			)}
			aria-label={`${lifecycle.actionType} lifecycle`}
		>
			{lifecycle.stages.map((stage, index) => (
				<li
					key={stage.id}
					className={cn(
						"relative flex items-start",
						index < lifecycle.stages.length - 1 ? "flex-1" : "",
					)}
				>
					<div
						className={cn("flex flex-col", compact ? "w-[112px]" : "w-[132px]")}
					>
						<div className="flex items-center">
							<span
								className={cn(
									"grid size-5 shrink-0 place-items-center rounded-full border text-[10px]",
									stage.status === "completed" &&
										"border-moss bg-moss text-white",
									stage.status === "current" &&
										"border-interior-accent bg-interior-accent text-white ring-4 ring-accent-soft",
									stage.status === "pending" &&
										"border-hairline-strong bg-panel text-ink-3",
									stage.status === "skipped" &&
										"border-dashed border-hairline-strong bg-panel text-ink-3",
									stage.status === "cancelled" &&
										"border-flag bg-flag/10 text-flag",
								)}
							>
								{stage.status === "completed" ? (
									<Check aria-hidden />
								) : stage.status === "skipped" ? (
									<>
										<span aria-hidden>—</span>
										<span className="sr-only">Skipped</span>
									</>
								) : (
									index + 1
								)}
							</span>
							{index < lifecycle.stages.length - 1 ? (
								<span
									className={cn(
										"h-px flex-1",
										stage.status === "completed"
											? "bg-moss"
											: "bg-hairline-strong",
									)}
								/>
							) : null}
						</div>
						<p
							className={cn(
								"mt-2 pr-3 text-[10.5px] leading-4",
								stage.status === "current"
									? "font-medium text-ink"
									: "text-ink-3",
							)}
						>
							{stage.label}
						</p>
						{!compact && stage.date ? (
							<p className="meta mt-1 text-ink-3">
								{formatDate(stage.date)}
								{stage.dateCertainty === "expected" ? " · EXP" : ""}
							</p>
						) : null}
					</div>
				</li>
			))}
		</ol>
	);
}

function LifecycleRow({
	lifecycle,
	selected,
	onSelect,
}: {
	lifecycle: CorporateActionLifecycle;
	selected: boolean;
	onSelect: () => void;
}) {
	const latest = lifecycle.changes[0];
	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={selected}
			className={cn(
				"group grid w-full gap-5 border-t border-hairline px-5 py-5 text-left transition-colors hover:bg-sub focus-visible:relative sm:grid-cols-[170px_minmax(300px,1fr)_180px_20px] sm:items-center",
				selected && "bg-accent-soft/60",
			)}
		>
			<div className="flex min-w-0 items-center gap-3">
				<CompanyLogo
					logo={lifecycle.companyLogo}
					name={lifecycle.companyName}
					symbol={lifecycle.symbol}
					compact
				/>
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<strong className="truncate text-[13px] font-medium text-ink">
							{lifecycle.symbol}
						</strong>
						<Star
							aria-label="Watchlisted"
							weight="fill"
							className="size-3 text-ink-3"
						/>
					</div>
					<p className="mt-1 truncate text-[11.5px] text-ink-3">
						{lifecycle.companyName}
					</p>
					<p className="meta mt-2 uppercase text-ink-3">
						{lifecycle.actionType}
					</p>
				</div>
			</div>
			<div className="min-w-0 overflow-hidden">
				<StateBadge lifecycle={lifecycle} />
				<div className="mt-3 overflow-hidden">
					<ProgressRail lifecycle={lifecycle} compact />
				</div>
			</div>
			<div className="min-w-0">
				<p className="meta uppercase text-ink-3">Latest change</p>
				<p className="mt-2 text-[12px] font-medium leading-5 text-ink">
					{latest?.title ?? "Filing added as evidence"}
				</p>
				{latest?.previousValue && latest.newValue ? (
					<p className="mt-1 text-[11.5px] text-ink-2 tnum">
						<span className="line-through text-ink-3">
							{latest.previousValue}
						</span>{" "}
						<ArrowRight aria-hidden className="mx-1 inline size-3" />{" "}
						{latest.newValue}
					</p>
				) : null}
				<p className="mt-1 text-[10.5px] text-ink-3">
					{relativeTime(lifecycle.updatedAt)}
				</p>
			</div>
			<CaretRight
				aria-hidden
				className="hidden size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 sm:block"
			/>
		</button>
	);
}

function DetailPanel({ lifecycle }: { lifecycle: CorporateActionLifecycle }) {
	return (
		<section className="mat-panel rounded-[14px]">
			<header className="border-b border-hairline px-5 py-5 sm:px-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="meta uppercase text-ink-3">Selected lifecycle</p>
						<h2 className="mt-2 text-xl font-medium tracking-[-0.03em] text-ink">
							{lifecycle.companyName}{" "}
							<span className="font-normal text-ink-3">
								· {lifecycle.actionType}
							</span>
						</h2>
						<div className="mt-2 flex items-center gap-3">
							<StateBadge lifecycle={lifecycle} />
							<span className="text-[11px] text-ink-3">
								Updated {relativeTime(lifecycle.updatedAt)}
							</span>
						</div>
					</div>
				</div>
			</header>

			<div className="grid xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.75fr)]">
				<div className="min-w-0 border-b border-hairline p-5 sm:p-6 xl:border-r xl:border-b-0">
					<div className="flex items-center justify-between">
						<h3 className="text-[13px] font-medium text-ink">Lifecycle</h3>
						{lifecycle.nextExpectedStage ? (
							<p className="text-[11.5px] text-ink-3">
								Typically follows:{" "}
								<span className="font-medium text-ink">
									{lifecycle.nextExpectedStage}
								</span>
							</p>
						) : null}
					</div>
					<div className="mt-6 overflow-x-auto pb-2">
						<ProgressRail lifecycle={lifecycle} />
					</div>
					<h3 className="mt-7 text-[13px] font-medium text-ink">Key terms</h3>
					<dl className="mt-3 grid gap-px overflow-hidden rounded-[10px] border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
						{lifecycle.terms.map((term) => (
							<div key={term.label} className="bg-panel p-3.5">
								<dt className="meta uppercase text-ink-3">{term.label}</dt>
								<dd className="mt-2 text-[13px] font-medium text-ink tnum">
									{term.value}
								</dd>
								{term.certainty ? (
									<span
										className={cn(
											"mt-2 inline-block text-[9.5px] uppercase tracking-wide",
											term.certainty === "confirmed"
												? "text-moss"
												: "text-ink-3",
										)}
									>
										{term.certainty}
									</span>
								) : null}
							</div>
						))}
					</dl>
				</div>
				<aside className="p-5 sm:p-6">
					<h3 className="text-[13px] font-medium text-ink">
						Meaningful changes
					</h3>
					<div className="mt-4 flex flex-col gap-4">
						{lifecycle.changes.map((change) => (
							<article
								key={change.id}
								className="border-l border-hairline-strong pl-3"
							>
								<time className="meta text-ink-3">
									{formatDate(change.timestamp)}
								</time>
								<h4 className="mt-2 text-[12px] font-medium text-ink">
									{change.title}
								</h4>
								{change.previousValue && change.newValue ? (
									<p className="mt-1 text-[11.5px] text-ink-2">
										<span className="line-through text-ink-3">
											{change.previousValue}
										</span>{" "}
										→ {change.newValue}
									</p>
								) : null}
								{change.description ? (
									<p className="mt-1 text-[11px] leading-4 text-ink-3">
										{change.description}
									</p>
								) : null}
							</article>
						))}
						{lifecycle.changes.length === 0 ? (
							<p className="text-[11.5px] leading-5 text-ink-3">
								No material state or field changes detected yet.
							</p>
						) : null}
					</div>
				</aside>
			</div>

			<footer className="border-t border-hairline px-5 py-4 sm:px-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FileText aria-hidden className="size-4 text-ink-3" />
						<h3 className="text-[12px] font-medium text-ink">Source filings</h3>
					</div>
					<span className="text-[10.5px] text-ink-3">
						Every displayed fact retains a filing reference
					</span>
				</div>
				<div className="mt-3 grid gap-2 lg:grid-cols-3">
					{lifecycle.announcements.map((item) => (
						<a
							key={item.id}
							href={item.sourceUrl}
							target="_blank"
							rel="noreferrer"
							className="rounded-lg border border-hairline bg-sub p-3"
						>
							<div className="flex items-center justify-between">
								<span className="meta text-ink-3">{formatDate(item.date)}</span>
								<Badge variant="outline">{item.exchange}</Badge>
							</div>
							<p className="mt-2 text-[11.5px] font-medium leading-4 text-ink">
								{item.headline}
							</p>
							<p className="meta mt-2 text-ink-3">{item.id}</p>
						</a>
					))}
				</div>
			</footer>
		</section>
	);
}

export function CorporateActionDashboard() {
	const queryClient = useQueryClient();
	const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
	const [query, setQuery] = useState("");
	const [symbolInput, setSymbolInput] = useState("");
	const [selectedId, setSelectedId] = useState<string>();
	const lifecycleQuery = useQuery({
		queryKey: ["lifecycles"],
		queryFn: () =>
			requestJson<LifecycleListResponse>("/backend/api/lifecycles"),
		refetchInterval: 20_000,
	});
	const symbolsQuery = useQuery({
		queryKey: ["symbols"],
		queryFn: () =>
			requestJson<{ data: WatchlistSymbol[] }>("/backend/api/symbols"),
	});
	useErrorToast(lifecycleQuery.error, "lifecycle-query-error");
	useErrorToast(symbolsQuery.error, "symbols-query-error");
	const addSymbol = useMutation({
		mutationFn: (symbol: string) =>
			requestJson<{ data: WatchlistSymbol }>("/backend/api/symbols", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ symbol }),
			}),
		onSuccess: async () => {
			setSymbolInput("");
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["symbols"] }),
				queryClient.invalidateQueries({ queryKey: ["lifecycles"] }),
			]);
		},
		onError: (error) => toast.error(error.message),
	});
	const removeSymbol = useMutation({
		mutationFn: async (symbol: string) => {
			const response = await fetch(
				`/backend/api/symbols/${encodeURIComponent(symbol)}`,
				{ method: "DELETE" },
			);
			if (!response.ok) throw new Error("Unable to remove symbol.");
		},
		onSuccess: async () => {
			setSelectedId(undefined);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["symbols"] }),
				queryClient.invalidateQueries({ queryKey: ["lifecycles"] }),
			]);
		},
		onError: (error) => toast.error(error.message),
	});
	const lifecycles = lifecycleQuery.data?.data ?? EMPTY_LIFECYCLES;
	const visible = useMemo(
		() =>
			lifecycles.filter((item) => {
				const matchesQuery =
					`${item.symbol} ${item.companyName} ${item.actionType}`
						.toLowerCase()
						.includes(query.toLowerCase());
				const matchesFilter =
					filter === "All" ||
					(filter === "Updated today" &&
						item.updatedAt.slice(0, 10) ===
							new Date().toISOString().slice(0, 10)) ||
					(filter === "Rights issues" && item.actionType === "Rights Issue") ||
					(filter === "Dividends" && item.actionType === "Dividend") ||
					(filter === "Needs review" && item.state === "needs_review");
				return matchesQuery && matchesFilter;
			}),
		[filter, lifecycles, query],
	);
	const selected =
		lifecycles.find((item) => item.id === selectedId) ?? lifecycles[0];
	const summary = lifecycleQuery.data?.summary ?? {
		active: 0,
		upcomingDates: 0,
		updatedToday: 0,
		completed: 0,
		needsReview: 0,
	};
	const stream = lifecycleQuery.data?.stream ?? "disconnected";
	useEffect(() => {
		const toastId = "drishti-key-required";
		if (stream === "not_configured") {
			toast.error("Drishti key required", { id: toastId });
			return;
		}
		toast.dismiss(toastId);
	}, [stream]);
	const streamLabel =
		stream === "connected"
			? "Drishti feed · live"
			: "Drishti feed · reconnecting";
	const metrics = [
		{ label: "Active", value: summary.active },
		{
			label: "Upcoming",
			value: summary.upcomingDates,
		},
		{ label: "Updated today", value: summary.updatedToday },
		{
			label: "Completed",
			value: summary.completed,
		},
		{ label: "Needs review", value: summary.needsReview },
	];

	function submitSymbol(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		const value = symbolInput.trim();
		if (value) addSymbol.mutate(value);
	}

	return (
		<main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-5 py-10 sm:px-8 sm:py-14">
			<section className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
				<div>
					{stream !== "not_configured" ? (
						<div className="mb-3 flex items-center gap-2">
							<span
								className={cn(
									"size-1.5 rounded-full",
									stream === "connected" ? "bg-moss" : "bg-flag",
								)}
							/>
							<span className="meta uppercase text-ink-3">{streamLabel}</span>
						</div>
					) : null}
					<h1 className="text-[clamp(26px,3vw,34px)] font-medium leading-[1.05] tracking-[-0.04em] text-ink">
						Corporate actions
					</h1>
					<p className="mt-2.5 text-[13px] text-ink-3">
						Track dates, changes, and source filings.
					</p>
				</div>
				<form onSubmit={submitSymbol} className="w-full lg:w-[360px]">
					<div className="flex items-start gap-2">
						<Input
							id="symbol"
							value={symbolInput}
							onChange={(event) =>
								setSymbolInput(event.target.value.toUpperCase())
							}
							placeholder="Company symbol"
							autoComplete="off"
							disabled={addSymbol.isPending}
						/>
						<PopButton
							type="submit"
							color="neutral"
							disabled={addSymbol.isPending || !symbolInput.trim()}
							className="min-w-[72px]"
						>
							{addSymbol.isPending ? "Adding…" : "Add"}
						</PopButton>
					</div>
					{symbolsQuery.data?.data.length ? (
						<div className="mt-2 flex flex-wrap gap-1.5">
							{symbolsQuery.data.data.map((item) => (
								<span
									key={item.symbol}
									className="inline-flex items-center gap-1 rounded-full border border-hairline bg-panel pl-2.5 text-[10.5px] text-ink-2"
								>
									{item.symbol}
									<button
										type="button"
										onClick={() => removeSymbol.mutate(item.symbol)}
										aria-label={`Remove ${item.symbol}`}
										className="grid size-7 place-items-center text-ink-3 hover:text-flag"
									>
										<Trash aria-hidden className="size-3" />
									</button>
								</span>
							))}
						</div>
					) : null}
				</form>
			</section>

			<section
				aria-label="Lifecycle summary"
				className="mt-10 grid border-y border-hairline sm:grid-cols-5 sm:divide-x sm:divide-hairline"
			>
				{metrics.map(({ label, value }) => (
					<div
						key={label}
						className="flex items-baseline justify-between border-b border-hairline px-3 py-3.5 last:border-b-0 sm:block sm:border-b-0 sm:px-5"
					>
						<div className="contents sm:block">
							<p className="text-[11.5px] text-ink-3">{label}</p>
							<p className="text-lg font-medium tracking-tight text-ink tnum sm:mt-2">
								{String(value)}
							</p>
						</div>
					</div>
				))}
			</section>

			<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<nav
					className="flex gap-1 overflow-x-auto rounded-[10px] bg-well p-1"
					aria-label="Quick filters"
				>
					{FILTERS.map((item) => (
						<button
							key={item}
							type="button"
							onClick={() => setFilter(item)}
							aria-pressed={filter === item}
							className={cn(
								"shrink-0 rounded-[7px] px-3 py-1.5 text-[11.5px] font-medium transition-[background-color,color,box-shadow] duration-150",
								filter === item
									? "bg-panel text-ink shadow-[0_1px_2px_rgba(28,25,23,0.10)]"
									: "text-ink-3 hover:text-ink",
							)}
						>
							{item}
						</button>
					))}
				</nav>
				<div className="relative w-full sm:w-72">
					<MagnifyingGlass
						aria-hidden
						className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
					/>
					<Input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Filter current lifecycles"
						aria-label="Filter current lifecycles"
						className="pl-9"
					/>
				</div>
			</div>

			<section className="mt-4 overflow-hidden rounded-[12px] border border-hairline bg-panel">
				<div className="flex items-center justify-between px-5 py-4">
					<div>
						<h2 className="text-[13px] font-medium text-ink">
							Lifecycle activity
						</h2>
						<p className="mt-1 text-[11px] text-ink-3">
							Announcements are grouped by the corporate action they update.
						</p>
					</div>
					<span className="meta text-ink-3">{visible.length} RESULTS</span>
				</div>
				{lifecycleQuery.isLoading ? (
					<div className="border-t border-hairline px-5 py-12 text-center text-[12px] text-ink-3">
						Loading lifecycles…
					</div>
				) : visible.length ? (
					visible.map((lifecycle) => (
						<LifecycleRow
							key={lifecycle.id}
							lifecycle={lifecycle}
							selected={selected.id === lifecycle.id}
							onSelect={() => setSelectedId(lifecycle.id)}
						/>
					))
				) : (
					<div className="border-t border-hairline px-5 py-12 text-center text-[12px] text-ink-3">
						{lifecycles.length === 0
							? "Add a symbol above to reconstruct its corporate-action lifecycles."
							: "No lifecycles match this view."}
					</div>
				)}
			</section>

			{selected ? (
				<div className="mt-5">
					<DetailPanel lifecycle={selected} />
				</div>
			) : null}
		</main>
	);
}
