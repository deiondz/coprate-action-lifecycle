import { ensureSession } from "@better-auth-ui/react/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { auth } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";

export default async function Home() {
	const requestHeaders = await headers();
	const queryClient = getQueryClient();

	const session = await ensureSession(queryClient, auth, {
		headers: requestHeaders,
	});

	if (!session) {
		redirect("/auth/sign-in?redirectTo=%2F");
	}

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AppShell session={session} />
		</HydrationBoundary>
	);
}
