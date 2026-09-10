"use client";

import {
	DotsThreeOutline,
	Folder,
	ShareNetwork,
	Trash,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ComponentType } from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

export type NavProject = {
	name: string;
	href: string;
	icon: ComponentType;
};

export function NavProjects({ projects }: { projects: NavProject[] }) {
	const { isMobile } = useSidebar();

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Starter Areas</SidebarGroupLabel>
			<SidebarMenu>
				{projects.map((project) => {
					const Icon = project.icon;

					return (
						<SidebarMenuItem key={project.name}>
							<SidebarMenuButton
								render={
									<Link href={project.href}>
										<Icon />
										<span>{project.name}</span>
									</Link>
								}
							/>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuAction
										showOnHover
										className="aria-expanded:bg-sidebar-accent"
									>
										<DotsThreeOutline />
										<span className="sr-only">More</span>
									</SidebarMenuAction>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-48"
									side={isMobile ? "bottom" : "right"}
									align={isMobile ? "end" : "start"}
								>
									<DropdownMenuItem>
										<Folder className="text-muted-foreground" />
										<span>Open area</span>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<ShareNetwork className="text-muted-foreground" />
										<span>Copy link</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem variant="destructive">
										<Trash />
										<span>Remove shortcut</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					);
				})}

				<SidebarMenuItem>
					<SidebarMenuButton>
						<DotsThreeOutline />
						<span>More</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
