import { viewPaths } from "@better-auth-ui/core";
import { notFound } from "next/navigation";

import { Auth } from "@/components/auth/auth";
import { InteriorThemeToggle } from "@/components/interior/theme-toggle";
import { Logo } from "@/components/logo";
import { magicLinkPlugin } from "@/lib/auth/magic-link-plugin";
import { isZeptoMailConfigured } from "@/lib/email-delivery";

const emailDeliveryEnabled = isZeptoMailConfigured();

const authViewPaths = emailDeliveryEnabled
	? {
			...viewPaths.auth,
			...magicLinkPlugin().viewPaths?.auth,
		}
	: {
			signIn: viewPaths.auth.signIn,
			signOut: viewPaths.auth.signOut,
			signUp: viewPaths.auth.signUp,
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
	const showIntroduction =
		path === viewPaths.auth.signIn || path === viewPaths.auth.signUp;

	return (
		<div className="flex min-h-svh flex-1 p-3 sm:p-5">
			<div className="mat-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px]">
				<header className="flex h-12 shrink-0 items-center gap-3 border-hairline border-b px-5">
					<Logo alt="Actions desk" className="h-5" />
					<span className="text-[13px] font-medium tracking-[-0.02em] text-ink">
						Actions desk
					</span>
					<span className="flex-1" />
					<span className="meta hidden uppercase text-ink-3 sm:block">
						Corporate actions
					</span>
					<InteriorThemeToggle />
				</header>

				<main className="flex flex-1 px-6 sm:px-12">
					<div className="mx-auto flex w-full max-w-[900px] items-center py-10 sm:py-16">
						{showIntroduction ? (
							<div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
								<section className="max-w-[490px]">
									<p className="meta uppercase text-ink-3">
										Operations workspace
									</p>
									<h1 className="mt-6 text-balance text-[clamp(32px,5vw,52px)] font-medium leading-[1.08] tracking-[-0.04em] text-ink">
										Move every event from announcement to delivery.
									</h1>
									<p className="mt-7 max-w-[43ch] text-pretty text-[15px] leading-[1.7] text-ink-2">
										A focused desk for normalizing terms, checking exchange
										data, and publishing corporate actions with a clear audit
										trail.
									</p>
								</section>
								<Auth path={path} />
							</div>
						) : (
							<div className="flex w-full justify-center">
								<Auth path={path} />
							</div>
						)}
					</div>
				</main>
			</div>
		</div>
	);
}
