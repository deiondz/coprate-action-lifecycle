"use client";

import type { User as BetterAuthUser } from "better-auth";
import Link from "next/link";
import type { ReactNode } from "react";

import { MaxWidthContainer } from "@/components/max-width-container";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export function AppShell({
	session,
	breadcrumbPage = "Dashboard",
	children,
}: {
	session: {
		user: BetterAuthUser & {
			username?: string | null;
			displayUsername?: string | null;
		};
	};
	breadcrumbPage?: string;
	children?: ReactNode;
}) {
	return (
		<SidebarProvider>
			<AppSidebar session={session} />
			<SidebarInset className="relative isolate flex flex-1 flex-col overflow-hidden">
				<div
					aria-hidden="true"
					className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,var(--auth-grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--auth-grid-line)_1px,transparent_1px)] bg-size-[6rem_4rem] [--auth-grid-line:color-mix(in_oklab,var(--muted-foreground)_7%,transparent)] dark:[--auth-grid-line:color-mix(in_oklab,var(--muted-foreground)_3%,transparent)]"
				/>
				<header className="relative z-10 flex h-16 w-full shrink-0 items-center gap-2 border-muted border-b bg-sidebar/50">
					<MaxWidthContainer className="flex min-w-0 items-center gap-2 py-0">
						<SidebarTrigger className="-ml-1" />

						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem className="hidden md:block">
									<BreadcrumbLink render={<Link href="/">Nevin</Link>} />
								</BreadcrumbItem>
								<BreadcrumbSeparator className="hidden md:block" />
								<BreadcrumbItem>
									<BreadcrumbPage>{breadcrumbPage}</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</MaxWidthContainer>
				</header>
				{children ?? (
					<MaxWidthContainer className="flex flex-1 flex-col gap-4">
						<div className="grid auto-rows-min gap-4 md:grid-cols-3">
							<section className="aspect-video rounded-xl bg-muted/60 p-4">
								<div className="flex h-full flex-col justify-between">
									<div>
										<h2 className="font-medium text-sm">Auth-ready shell</h2>
										<p className="mt-1 text-muted-foreground text-sm">
											Protected by Better Auth with session hydration.
										</p>
									</div>
								</div>
							</section>
							<section className="aspect-video rounded-xl bg-muted/50 p-4">
								<h2 className="font-medium text-sm">Settings</h2>
								<p className="mt-1 text-muted-foreground text-sm">
									Account and security routes stay server-protected.
								</p>
							</section>
							<section className="aspect-video rounded-xl bg-muted/50 p-4">
								<h2 className="font-medium text-sm">Starter areas</h2>
								<p className="mt-1 text-muted-foreground text-sm">
									Use the sidebar to grow product-specific sections.
								</p>
							</section>
						</div>
						<section className="min-h-[40rem] flex-1 rounded-xl bg-muted/50 p-4 md:min-h-min">
							<h2 className="font-medium text-sm">Workspace</h2>
							<p className="mt-1 max-w-xl text-muted-foreground text-sm">
								This area is ready for the first product dashboard, tables,
								forms, or onboarding state.
							</p>
						</section>
					</MaxWidthContainer>
				)}
			</SidebarInset>
		</SidebarProvider>
	);
}
