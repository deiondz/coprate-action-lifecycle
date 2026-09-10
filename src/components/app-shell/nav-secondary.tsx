"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ComponentType } from "react";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export type NavSecondaryItem = {
	title: string;
	href: string;
	icon: ComponentType;
};

export function NavSecondary({
	items,
	...props
}: {
	items: NavSecondaryItem[];
} & ComponentPropsWithoutRef<typeof SidebarGroup>) {
	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => {
						const Icon = item.icon;

						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									size="sm"
									render={
										<Link href={item.href}>
											<Icon />
											<span>{item.title}</span>
										</Link>
									}
								/>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
