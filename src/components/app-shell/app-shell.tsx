"use client";

import type { User as BetterAuthUser } from "better-auth";
import type { ReactNode } from "react";

import { UserButton } from "@/components/auth/user/user-button";
import { CorporateActionDashboard } from "@/components/corporate-action-dashboard";
import { Signature } from "@/components/signature";

export function AppShell({
	session,
	breadcrumbPage = "Monitor",
	children,
}: {
	session?: {
		user: BetterAuthUser & {
			username?: string | null;
			displayUsername?: string | null;
		};
	};
	breadcrumbPage?: string;
	children?: ReactNode;
}) {
	return (
		<div className="flex min-h-svh w-full flex-col bg-panel">
			<header data-page={breadcrumbPage} className="border-b border-hairline">
				<div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between px-5 sm:px-8">
					<div className="flex items-center text-ink">
						<Signature
							text="Drishti"
							color="currentColor"
							fontSize={48}
							duration={0.65}
							className="h-8 w-auto overflow-visible"
						/>
					</div>
					<UserButton align="end" initialSession={session} size="icon" />
				</div>
			</header>
			{children ?? <CorporateActionDashboard />}
		</div>
	);
}
