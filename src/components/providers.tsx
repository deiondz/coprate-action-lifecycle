"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { SocialProvider } from "better-auth/social-providers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { deleteUserPlugin } from "@/lib/auth/delete-user-plugin";
import { magicLinkPlugin } from "@/lib/auth/magic-link-plugin";
import { passkeyPlugin } from "@/lib/auth/passkey-plugin";
import { authClient } from "@/lib/auth-client";
import { getQueryClient } from "@/lib/query-client";
import { AuthProvider } from "./auth/auth-provider";
import { Toaster } from "./ui/sonner";

export function Providers({
	children,
	emailDeliveryEnabled,
	socialProviders,
}: {
	children: ReactNode;
	emailDeliveryEnabled: boolean;
	socialProviders: SocialProvider[];
}) {
	const router = useRouter();
	const queryClient = getQueryClient();

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider
				authClient={authClient}
				emailAndPassword={{
					enabled: true,
					forgotPassword: emailDeliveryEnabled,
					requireEmailVerification: emailDeliveryEnabled,
				}}
				redirectTo="/"
				socialProviders={socialProviders}
				navigate={({ to, replace }) =>
					replace ? router.replace(to) : router.push(to)
				}
				plugins={[
					deleteUserPlugin(),
					...(emailDeliveryEnabled ? [magicLinkPlugin()] : []),
					passkeyPlugin(),
				]}
				Link={Link}
			>
				{children}

				<Toaster />
			</AuthProvider>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
