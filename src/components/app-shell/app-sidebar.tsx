"use client";

import {
	CalendarBlank,
	ClockCounterClockwise,
	Gear,
	House,
	Star,
} from "@phosphor-icons/react/dist/ssr";
import type { User as BetterAuthUser } from "better-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { UserButton } from "@/components/auth/user/user-button";
import { Signature } from "@/components/signature";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";

export function AppSidebar({
	session,
	...props
}: ComponentProps<typeof Sidebar> & {
	session?: {
		user: BetterAuthUser & {
			username?: string | null;
			displayUsername?: string | null;
		};
	};
}) {
	const pathname = usePathname();
	const navMain = [
		{
			title: "Monitor",
			href: "/",
			icon: House,
			isActive: pathname === "/",
		},
		{
			title: "Calendar",
			href: "/#calendar",
			icon: CalendarBlank,
			isActive: false,
		},
		{ title: "Watchlist", href: "/#watchlist", icon: Star, isActive: false },
		{
			title: "Company history",
			href: "/#history",
			icon: ClockCounterClockwise,
			isActive: false,
		},
		...(session
			? [
					{
						title: "Settings",
						href: "/settings/account",
						icon: Gear,
						isActive: pathname.startsWith("/settings"),
						items: [
							{ title: "Account", href: "/settings/account" },
							{ title: "Security", href: "/settings/security" },
						],
					},
				]
			: []),
	];

	return (
		<Sidebar variant="sidebar" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							render={
								<Link href="/">
									<div className="flex h-8 items-center text-foreground">
										<Signature
											text="Drishti"
											color="currentColor"
											fontSize={40}
											duration={0.65}
											className="h-7 w-auto overflow-visible"
										/>
									</div>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium tracking-[-0.02em]">
											Drishti
										</span>
										<span className="meta truncate uppercase text-ink-3">
											Corporate actions
										</span>
									</div>
								</Link>
							}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMain} />
			</SidebarContent>
			{session ? (
				<SidebarFooter>
					<UserButton
						align="start"
						className="w-full justify-start"
						initialSession={session}
						sideOffset={4}
					/>
				</SidebarFooter>
			) : null}
			<SidebarRail />
		</Sidebar>
	);
}
