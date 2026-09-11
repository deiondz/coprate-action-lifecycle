"use client";

import { useAuth } from "@better-auth-ui/react";

import { cn } from "@/lib/utils";
import { ProviderButton } from "./provider-button";

export type ProviderButtonsProps = {
	socialLayout?: SocialLayout;
};

export type SocialLayout = "auto" | "horizontal" | "vertical" | "grid";

type ResolvedSocialLayout =
	| "single"
	| "pair"
	| "compact"
	| "horizontal"
	| "vertical";

function resolveSocialLayout(
	socialLayout: SocialLayout,
	providerCount: number,
): ResolvedSocialLayout {
	if (socialLayout === "horizontal") return "horizontal";
	if (providerCount === 1) return "single";
	if (socialLayout === "vertical") return "vertical";
	if (providerCount === 2) return "pair";
	return "compact";
}

function providerDisplay(layout: ResolvedSocialLayout) {
	if (layout === "compact" || layout === "horizontal") return "icon";
	if (layout === "vertical") return "full";
	return "name";
}

/**
 * Render sign-in buttons for configured social providers. Each button owns its own sign-in mutation
 * and reads the shared sign-in pending state from React Query.
 *
 * @param socialLayout - Preferred layout for the provider buttons; `"auto"` chooses based on the number of providers.
 */
export function ProviderButtons({
	socialLayout = "auto",
}: ProviderButtonsProps) {
	const { socialProviders } = useAuth();
	const providerCount = socialProviders?.length ?? 0;

	if (providerCount === 0) {
		return null;
	}

	const resolvedSocialLayout = resolveSocialLayout(socialLayout, providerCount);

	return (
		<div
			className={cn(
				"gap-3",
				resolvedSocialLayout === "single" && "grid grid-cols-1",
				resolvedSocialLayout === "pair" && "grid grid-cols-2",
				resolvedSocialLayout === "compact" && "grid grid-cols-3",
				resolvedSocialLayout === "horizontal" && "flex flex-row flex-wrap",
				resolvedSocialLayout === "vertical" && "flex flex-col",
			)}
		>
			{socialProviders?.map((provider) => (
				<ProviderButton
					key={provider}
					provider={provider}
					display={providerDisplay(resolvedSocialLayout)}
					className={cn(
						"h-10 active:scale-[0.985]",
						resolvedSocialLayout === "horizontal" && "flex-1",
						resolvedSocialLayout === "vertical" && "w-full",
					)}
				/>
			))}
		</div>
	);
}
