"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ComponentType } from "react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export type NavMainItem = {
	title: string;
	href: string;
	icon: ComponentType;
	isActive?: boolean;
	items?: {
		title: string;
		href: string;
	}[];
};

export function NavMain({ items }: { items: NavMainItem[] }) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Platform</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => {
					const Icon = item.icon;

					return (
						<Collapsible key={item.title} defaultOpen={item.isActive}>
							<SidebarMenuItem>
								<SidebarMenuButton
									tooltip={item.title}
									isActive={item.isActive}
									render={
										<Link href={item.href}>
											<Icon />
											<span>{item.title}</span>
										</Link>
									}
								/>

								{item.items?.length ? (
									<>
										<CollapsibleTrigger
											render={
												<SidebarMenuAction className="data-[panel-open]:rotate-90">
													<CaretRight />
													<span className="sr-only">Toggle</span>
												</SidebarMenuAction>
											}
										/>
										<CollapsibleContent>
											<SidebarMenuSub>
												{item.items.map((subItem) => (
													<SidebarMenuSubItem key={subItem.title}>
														<SidebarMenuSubButton
															render={
																<Link href={subItem.href}>
																	<span>{subItem.title}</span>
																</Link>
															}
														/>
													</SidebarMenuSubItem>
												))}
											</SidebarMenuSub>
										</CollapsibleContent>
									</>
								) : null}
							</SidebarMenuItem>
						</Collapsible>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
