"use client";

import {
	type OrganizationAuthClient,
	useActiveOrganization,
	useAuth,
	useAuthPlugin,
	useListOrganizationMembers,
	useSession,
} from "@better-auth-ui/react";
import type { Organization } from "better-auth/client";
import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import { organizationPlugin } from "@/lib/auth/organization-plugin";
import { cn } from "@/lib/utils";
import {
	OrganizationLogo,
	type OrganizationLogoSize,
} from "./organization-logo";
import { OrganizationViewSkeleton } from "./organization-view-skeleton";

export type OrganizationViewProps = {
	className?: string;
	isPending?: boolean;
	size?: OrganizationLogoSize;
	hideRole?: boolean;
	hideSlug?: boolean;
	organization?: Partial<Organization>;
};

function isOrganizationViewPending({
	isPending,
	hasProvidedOrganization,
	activeOrganizationPending,
	hideRole,
	organizationId,
	membersPending,
}: {
	isPending?: boolean;
	hasProvidedOrganization: boolean;
	activeOrganizationPending: boolean;
	hideRole?: boolean;
	organizationId?: string;
	membersPending: boolean;
}): boolean {
	return Boolean(
		isPending ||
			(!hasProvidedOrganization && activeOrganizationPending) ||
			(!hideRole && organizationId && membersPending),
	);
}

function logoClassName(size: OrganizationLogoSize): string | undefined {
	return size === "sm" ? "size-5" : undefined;
}

function logoSize(size: OrganizationLogoSize): OrganizationLogoSize {
	return size === "lg" ? "md" : "sm";
}

/**
 * Compact organization row: logo, primary name, secondary slug — analogous to `UserView`.
 */
export function OrganizationView({
	className,
	isPending,
	size = "md",
	hideSlug,
	hideRole,
	organization,
	...props
}: OrganizationViewProps & ComponentProps<"div">) {
	const { authClient } = useAuth();
	const { roles, slugPrefix } = useAuthPlugin(organizationPlugin);

	const { data: session } = useSession(authClient);

	const { data: activeOrganization, isPending: activeOrganizationPending } =
		useActiveOrganization(authClient as OrganizationAuthClient, {
			enabled: !organization && !isPending,
		});

	const resolvedOrganization = organization ?? activeOrganization;

	const { data: membersList, isPending: membersPending } =
		useListOrganizationMembers(authClient as OrganizationAuthClient, {
			query: {
				organizationId: resolvedOrganization?.id,
			},
			enabled: !!resolvedOrganization?.id && !hideRole,
		});

	const membership = membersList?.members?.find(
		(member) => member.userId === session?.user.id,
	);

	if (
		isOrganizationViewPending({
			isPending,
			hasProvidedOrganization: Boolean(organization),
			activeOrganizationPending,
			hideRole,
			organizationId: resolvedOrganization?.id,
			membersPending,
		})
	) {
		return (
			<OrganizationViewSkeleton
				className={className}
				hideSlug={hideSlug}
				size={size}
				{...props}
			/>
		);
	}

	return (
		<div
			className={cn("flex min-w-0 items-center gap-2", className)}
			{...props}
		>
			<OrganizationLogo
				organization={resolvedOrganization}
				className={logoClassName(size)}
				size={logoSize(size)}
			/>

			<div className="flex min-w-0 flex-col">
				<div className="flex min-w-0 items-center gap-2">
					<p className="truncate text-sm font-medium leading-tight text-foreground">
						{resolvedOrganization?.name}
					</p>

					{!hideRole && !!membership && (
						<Badge variant="secondary" className="-my-0.5 shrink-0">
							{roles?.[membership.role] ?? membership.role}
						</Badge>
					)}
				</div>

				{!hideSlug && !!resolvedOrganization?.slug && (
					<p className="truncate overflow-x-hidden text-muted-foreground text-xs font-mono leading-tight">
						{slugPrefix}
						{resolvedOrganization.slug}
					</p>
				)}
			</div>
		</div>
	);
}
