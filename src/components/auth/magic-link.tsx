"use client";

import { authMutationKeys } from "@better-auth-ui/core";
import {
	type MagicLinkAuthClient,
	useAuth,
	useAuthPlugin,
	useSignInMagicLink,
} from "@better-auth-ui/react";
import { useIsMutating } from "@tanstack/react-query";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { magicLinkPlugin } from "@/lib/auth/magic-link-plugin";
import { cn } from "@/lib/utils";
import { ProviderButtons, type SocialLayout } from "./provider-buttons";

export type MagicLinkProps = {
	className?: string;
	socialLayout?: SocialLayout;
	socialPosition?: "top" | "bottom";
};

/**
 * Render a card-based sign-in form that sends an email magic link and optionally shows social provider buttons.
 *
 * @param className - Additional CSS class names applied to the card container
 * @param socialLayout - Layout style for social provider buttons
 * @param socialPosition - Position of social provider buttons; `"top"` or `"bottom"`. Defaults to `"bottom"`.
 * @returns The magic-link sign-in UI as a JSX element
 */
export function MagicLink({
	className,
	socialLayout,
	socialPosition = "bottom",
}: MagicLinkProps) {
	const {
		authClient,
		basePaths,
		baseURL,
		emailAndPassword,
		localization,
		plugins,
		redirectTo,
		socialProviders,
		viewPaths,
		Link,
	} = useAuth();
	const { localization: magicLinkLocalization } =
		useAuthPlugin(magicLinkPlugin);

	const [email, setEmail] = useState("");

	const { mutate: signInMagicLink, isPending: signInMagicLinkPending } =
		useSignInMagicLink(authClient as MagicLinkAuthClient, {
			onSuccess: () => {
				setEmail("");
				toast.success(magicLinkLocalization.magicLinkSent);
			},
		});

	const signInMutating = useIsMutating({
		mutationKey: authMutationKeys.signIn.all,
	});
	const signUpMutating = useIsMutating({
		mutationKey: authMutationKeys.signUp.all,
	});
	const isPending = signInMutating + signUpMutating > 0;

	const [fieldErrors, setFieldErrors] = useState<{
		email?: string;
	}>({});

	const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();
		signInMagicLink({ email, callbackURL: `${baseURL}${redirectTo}` });
	};

	const showSeparator = socialProviders && socialProviders.length > 0;

	return (
		<div
			className={cn(
				"flex h-full w-full flex-col md:h-auto md:max-w-[440px] md:px-4 md:py-6",
				className,
			)}
		>
			<Card className="min-h-full overflow-hidden rounded-none border-x-0 border-y-0 pb-0 shadow-none md:min-h-0 md:rounded-2xl md:border md:shadow-xs/5">
				<CardHeader className="justify-items-center gap-2 px-6 pb-5 pt-10 text-center md:pt-9">
					<Logo className="mb-5 h-9" />

					<CardTitle className="text-[2rem] font-semibold leading-none tracking-normal md:text-[2.125rem]">
						{localization.auth.signIn}
					</CardTitle>

					<CardDescription className="max-w-84 text-balance text-base leading-6">
						Enter your email and we&apos;ll send you a secure sign-in link.
					</CardDescription>
				</CardHeader>

				<CardContent className="px-6 pb-6 pt-0 md:px-7">
					<div className="flex flex-col gap-5">
						{socialPosition === "top" && (
							<>
								{socialProviders && socialProviders.length > 0 && (
									<ProviderButtons socialLayout={socialLayout ?? "grid"} />
								)}

								{showSeparator && (
									<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card my-1 text-xs uppercase">
										{localization.auth.or}
									</FieldSeparator>
								)}
							</>
						)}

						<form onSubmit={handleSubmit}>
							<FieldGroup className="gap-4">
								<Field data-invalid={!!fieldErrors.email}>
									<Label htmlFor="email">{localization.auth.email}</Label>

									<Input
										id="email"
										name="email"
										type="email"
										autoComplete="email"
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);

											setFieldErrors((prev) => ({
												...prev,
												email: undefined,
											}));
										}}
										placeholder="Email"
										required
										disabled={isPending}
										onInvalid={(e) => {
											e.preventDefault();

											setFieldErrors((prev) => ({
												...prev,
												email: (e.target as HTMLInputElement).validationMessage,
											}));
										}}
										aria-invalid={!!fieldErrors.email}
									/>

									<FieldError>{fieldErrors.email}</FieldError>
								</Field>

								<div className="flex flex-col gap-3 pt-1">
									<Button
										type="submit"
										disabled={isPending}
										className="h-10 w-full active:scale-[0.985]"
									>
										{signInMagicLinkPending && <Spinner />}

										{magicLinkLocalization.sendMagicLink}
									</Button>

									{plugins.flatMap((plugin) =>
										(plugin.authButtons ?? []).map((AuthButton, index) => (
											<AuthButton
												key={`${plugin.id}-${index.toString()}`}
												view="magicLink"
											/>
										)),
									)}
								</div>
							</FieldGroup>
						</form>

						{socialPosition === "bottom" && (
							<>
								{showSeparator && (
									<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card my-1 text-xs uppercase">
										{localization.auth.or}
									</FieldSeparator>
								)}

								{socialProviders && socialProviders.length > 0 && (
									<ProviderButtons socialLayout={socialLayout ?? "grid"} />
								)}
							</>
						)}
					</div>
				</CardContent>

				{emailAndPassword?.enabled && (
					<CardFooter className="mt-auto justify-center rounded-none border-t px-6 py-6 md:rounded-b-2xl md:bg-muted/72">
						<FieldDescription className="text-center text-base leading-6 md:text-sm">
							{localization.auth.needToCreateAnAccount}{" "}
							<Link
								href={`${basePaths.auth}/${viewPaths.auth.signUp}`}
								className="font-medium text-foreground underline underline-offset-4"
							>
								{localization.auth.signUp}
							</Link>
						</FieldDescription>
					</CardFooter>
				)}
			</Card>

			<div className="hidden w-full flex-col gap-y-4 px-px py-6 text-center text-muted-foreground text-sm md:flex md:flex-row md:justify-between">
				<div>© 2026</div>
				<div className="space-x-4">
					<a className="underline underline-offset-4" href="/terms">
						Terms
					</a>
					<a className="underline underline-offset-4" href="/privacy">
						Privacy
					</a>
				</div>
			</div>
		</div>
	);
}
