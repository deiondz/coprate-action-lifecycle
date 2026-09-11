"use client";

import {
	type OrganizationAuthClient,
	useActiveOrganization,
	useAuth,
	useAuthPlugin,
	useListOrganizations,
	useSession,
	useSetActiveOrganization,
} from "@better-auth-ui/react";
import {
	CaretUpDown as ChevronsUpDown,
	PlusCircle,
	Gear as SettingsIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Organization } from "better-auth/client";
import { type ComponentProps, type ReactElement, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { organizationPlugin } from "@/lib/auth/organization-plugin";
import { cn } from "@/lib/utils";
import { UserView } from "../user/user-view";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { OrganizationView } from "./organization-view";

/** Props for the `OrganizationSwitcher` component. */
export type OrganizationSwitcherProps = {
	className?: string;
	align?: "center" | "end" | "start";
	side?: "top" | "right" | "bottom" | "left";
	sideOffset?: number;
	trigger?: ReactElement<ComponentProps<typeof DropdownMenuTrigger>>;
	hideCreate?: boolean;
	hidePersonal?: boolean;
	hideSettings?: boolean;
	hideSlug?: boolean;
	setActive?: (organization: Organization | null) => void;
};

function DefaultSwitcherTrigger({
	activeOrganization,
	className,
	organizationLabel,
	viewState,
}: {
	activeOrganization: Organization | null | undefined;
	className?: string;
	organizationLabel: string;
	viewState: {
		hasSession: boolean;
		hidePersonal?: boolean;
		hideSlug: boolean;
		isPending: boolean;
	};
}) {
	const { hasSession, hidePersonal, hideSlug, isPending } = viewState;
	let content = (
		<OrganizationView
			hideRole
			hideSlug={hideSlug}
			organization={{ name: organizationLabel }}
		/>
	);
	if (isPending) {
		content = <OrganizationView isPending hideRole hideSlug={hideSlug} />;
	} else if (activeOrganization) {
		content = <OrganizationView hideRole hideSlug={hideSlug} />;
	} else if (hasSession && !hidePersonal) {
		content = <UserView hideSubtitle={hideSlug} />;
	}

	return (
		<DropdownMenuTrigger
			className={cn(
				buttonVariants({ variant: "ghost" }),
				"h-auto px-2 py-2 text-left",
				className,
			)}
			disabled={!hasSession || isPending}
		>
			{content}
			<ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
		</DropdownMenuTrigger>
	);
}

function SwitcherHeader({
	activeOrganization,
	viewState,
}: {
	activeOrganization: Organization | null | undefined;
	viewState: {
		hasUser: boolean;
		hidePersonal?: boolean;
		hideSettings?: boolean;
		hideSlug: boolean;
		isPending: boolean;
	};
}) {
	const { hasUser, hidePersonal, hideSettings, hideSlug, isPending } =
		viewState;
	const { basePaths, localization, viewPaths, Link } = useAuth();
	const {
		localization: organizationLocalization,
		viewPaths: organizationViewPaths,
		slug,
		slugPrefix,
	} = useAuthPlugin(organizationPlugin);

	if (activeOrganization) {
		const settingsHref = slug
			? `${basePaths.organization}/${slugPrefix}${slug}/${organizationViewPaths.organization.settings}`
			: `${basePaths.organization}/${organizationViewPaths.organization.settings}`;
		return (
			<div className="flex items-center justify-between gap-4 px-2 py-2">
				<OrganizationView
					hideRole
					hideSlug={hideSlug}
					organization={activeOrganization}
				/>
				{!hideSettings && (
					<Link
						href={settingsHref}
						className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
					>
						<SettingsIcon className="text-muted-foreground" />
						{organizationLocalization.manage}
					</Link>
				)}
			</div>
		);
	}

	if (isPending || !hasUser || hidePersonal) return null;
	return (
		<div className="flex items-center justify-between gap-4 px-2 py-2">
			<UserView hideSubtitle={hideSlug} />
			{!hideSettings && (
				<Link
					href={`${basePaths.settings}/${viewPaths.settings.account}`}
					className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
				>
					<SettingsIcon className="text-muted-foreground" />
					{localization.settings.settings}
				</Link>
			)}
		</div>
	);
}

function SwitcherItems({
	activeOrganization,
	hideCreate,
	hidePersonal,
	hideSlug,
	onCreate,
	onSetActive,
	otherOrganizations,
}: {
	activeOrganization: Organization | null | undefined;
	hideCreate?: boolean;
	hidePersonal?: boolean;
	hideSlug: boolean;
	onCreate: () => void;
	onSetActive: (organization: Organization | null) => void;
	otherOrganizations: Organization[];
}) {
	const { localization } = useAuthPlugin(organizationPlugin);
	const hasOtherEntries =
		otherOrganizations.length > 0 ||
		Boolean(activeOrganization && !hidePersonal);

	return (
		<>
			{!!activeOrganization && !hidePersonal && (
				<DropdownMenuItem onClick={() => onSetActive(null)}>
					<UserView hideSubtitle={hideSlug} />
				</DropdownMenuItem>
			)}
			{otherOrganizations.map((organization) => (
				<DropdownMenuItem
					key={organization.id}
					onClick={() => onSetActive(organization)}
				>
					<OrganizationView
						hideRole
						hideSlug={hideSlug}
						organization={organization}
					/>
				</DropdownMenuItem>
			))}
			{!hideCreate && (
				<>
					{hasOtherEntries && <DropdownMenuSeparator />}
					<DropdownMenuItem onClick={onCreate}>
						<PlusCircle className="text-muted-foreground" />
						{localization.createOrganization}
					</DropdownMenuItem>
				</>
			)}
		</>
	);
}

/**
 * Renders an organizations dropdown with a trigger button,
 * header summary, and a menu of organizations to switch to.
 */
export function OrganizationSwitcher({
	className,
	align,
	side,
	sideOffset,
	hideCreate,
	hidePersonal,
	hideSettings,
	hideSlug = true,
	setActive,
	trigger,
}: OrganizationSwitcherProps) {
	const { authClient, navigate, basePaths, viewPaths } = useAuth();
	const { data: session, isPending: sessionPending } = useSession(authClient);
	const {
		localization: organizationLocalization,
		viewPaths: organizationViewPaths,
		slug,
		slugPrefix,
	} = useAuthPlugin(organizationPlugin);

	const { data: activeOrganization, isPending: activeOrganizationPending } =
		useActiveOrganization(authClient as OrganizationAuthClient);

	const { data: organizations, isPending: organizationsPending } =
		useListOrganizations(authClient as OrganizationAuthClient);

	const { mutate: setActiveOrganization } = useSetActiveOrganization(
		authClient as OrganizationAuthClient,
	);

	const isPending =
		sessionPending ||
		(!!session && (organizationsPending || activeOrganizationPending));

	const [createOpen, setCreateOpen] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const otherOrganizations =
		organizations?.filter(
			(organization) => organization.id !== activeOrganization?.id,
		) ?? [];

	function handleSetActive(organization: Organization | null) {
		setDropdownOpen(false);

		if (setActive) {
			setActive(organization);
		} else if (slug !== undefined) {
			navigate({
				to: organization
					? `${basePaths.organization}/${slugPrefix}${organization.slug}/${organizationViewPaths.organization.settings}`
					: `${basePaths.settings}/${viewPaths.settings.account}`,
			});
		} else {
			setActiveOrganization({ organizationId: organization?.id ?? null });
		}
	}

	return (
		<>
			<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
				{trigger ?? (
					<DefaultSwitcherTrigger
						activeOrganization={activeOrganization}
						className={className}
						organizationLabel={organizationLocalization.organization}
						viewState={{
							hasSession: Boolean(session),
							hidePersonal,
							hideSlug,
							isPending,
						}}
					/>
				)}

				<DropdownMenuContent
					align={align}
					side={side}
					sideOffset={sideOffset}
					className="min-w-64 max-w-svw"
				>
					<SwitcherHeader
						activeOrganization={activeOrganization}
						viewState={{
							hasUser: Boolean(session?.user),
							hidePersonal,
							hideSettings,
							hideSlug,
							isPending,
						}}
					/>

					<DropdownMenuSeparator />
					<SwitcherItems
						activeOrganization={activeOrganization}
						hideCreate={hideCreate}
						hidePersonal={hidePersonal}
						hideSlug={hideSlug}
						onCreate={() => {
							setDropdownOpen(false);
							setCreateOpen(true);
						}}
						onSetActive={handleSetActive}
						otherOrganizations={otherOrganizations}
					/>
				</DropdownMenuContent>
			</DropdownMenu>

			<CreateOrganizationDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
			/>
		</>
	);
}
