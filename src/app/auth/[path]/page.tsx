import { viewPaths } from "@better-auth-ui/core";
import { notFound } from "next/navigation";

import { Auth } from "@/components/auth/auth";
import { magicLinkPlugin } from "@/lib/auth/magic-link-plugin";

const authViewPaths = {
	...viewPaths.auth,
	...magicLinkPlugin().viewPaths?.auth,
};

export default async function AuthPage({
	params,
}: {
	params: Promise<{
		path: string;
	}>;
}) {
	const { path } = await params;

	if (!Object.values(authViewPaths).includes(path)) {
		notFound();
	}

	return (
		<div className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-muted p-0 md:p-6">
			<div
				aria-hidden="true"
				className="absolute inset-0 -z-10 h-full w-full bg-muted bg-[linear-gradient(to_right,var(--auth-grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--auth-grid-line)_1px,transparent_1px)] bg-size-[6rem_4rem] [--auth-grid-line:color-mix(in_oklab,var(--muted-foreground)_7%,transparent)] dark:[--auth-grid-line:color-mix(in_oklab,var(--muted-foreground)_3%,transparent)]"
			/>
			<Auth path={path} />
		</div>
	);
}
