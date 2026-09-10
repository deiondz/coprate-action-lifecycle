"use client";

import { authMutationKeys } from "@better-auth-ui/core";
import {
	useAuth,
	useFetchOptions,
	useSignInEmail,
} from "@better-auth-ui/react";
import { useIsMutating } from "@tanstack/react-query";
import { type SyntheticEvent, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import { ProviderButtons, type SocialLayout } from "./provider-buttons";

export type SignInProps = {
	className?: string;
	socialLayout?: SocialLayout;
	socialPosition?: "top" | "bottom";
};

/**
 * Render the sign-in form UI with email/password, magic link, and social provider options.
 *
 * @param className - Optional additional container class names
 * @param socialLayout - Layout style for social provider buttons
 * @param socialPosition - Position of social provider buttons; `"top"` or `"bottom"`. Defaults to `"bottom"`.
 * @returns The rendered sign-in UI as a JSX element
 */
export function SignIn({
	className,
	socialLayout,
	socialPosition = "bottom",
}: SignInProps) {
	const {
		authClient,
		basePaths,
		emailAndPassword,
		localization,
		plugins,
		redirectTo,
		socialProviders,
		viewPaths,
		navigate,
		Link,
	} = useAuth();

	const { fetchOptions, resetFetchOptions } = useFetchOptions();

	const [password, setPassword] = useState("");

	const { mutate: signInEmail, isPending: signInEmailPending } = useSignInEmail(
		authClient,
		{
			onError: (error, { email }) => {
				setPassword("");

				if (error.error?.code === "EMAIL_NOT_VERIFIED") {
					sessionStorage.setItem("better-auth-ui.verify-email", email);
					navigate({
						to: `${basePaths.auth}/${viewPaths.auth.verifyEmail}`,
					});
				}

				resetFetchOptions();
			},
			onSuccess: () => navigate({ to: redirectTo }),
		},
	);

	const signInMutating = useIsMutating({
		mutationKey: authMutationKeys.signIn.all,
	});
	const signUpMutating = useIsMutating({
		mutationKey: authMutationKeys.signUp.all,
	});
	const isPending = signInMutating + signUpMutating > 0;

	const Captcha = plugins.find(
		(plugin) => plugin.captchaComponent,
	)?.captchaComponent;

	const [fieldErrors, setFieldErrors] = useState<{
		email?: string;
		password?: string;
	}>({});

	const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const email = formData.get("email") as string;
		const rememberMe = formData.get("rememberMe") === "on";

		signInEmail({
			email,
			password,
			...(emailAndPassword?.rememberMe ? { rememberMe } : {}),
			fetchOptions,
		});
	};

	const showSeparator =
		emailAndPassword?.enabled && socialProviders && socialProviders.length > 0;
	const hasSocialProviders = Boolean(socialProviders?.length);

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

					<CardDescription className="max-w-[21rem] text-balance text-base leading-6">
						Welcome back. Please sign in to continue.
					</CardDescription>
				</CardHeader>

				<CardContent className="px-6 pb-6 pt-0 md:px-7">
					<div className="flex flex-col gap-5">
						{(socialPosition === "top" || socialPosition === "bottom") &&
							hasSocialProviders && (
								<ProviderButtons socialLayout={socialLayout ?? "grid"} />
							)}

						{showSeparator && (
							<FieldSeparator className="*:data-[slot=field-separator-content]:bg-card my-1 text-xs uppercase">
								{localization.auth.or}
							</FieldSeparator>
						)}

						{emailAndPassword?.enabled && (
							<form onSubmit={handleSubmit}>
								<FieldGroup className="gap-4">
									<Field data-invalid={!!fieldErrors.email}>
										<Label htmlFor="email">{localization.auth.email}</Label>

										<Input
											id="email"
											name="email"
											type="email"
											autoComplete="email"
											placeholder="Email"
											required
											disabled={isPending}
											onChange={() => {
												setFieldErrors((prev) => ({
													...prev,
													email: undefined,
												}));
											}}
											onInvalid={(e) => {
												e.preventDefault();
												const el = e.target as HTMLInputElement;
												const msg = el.validity.valueMissing
													? localization.auth.fieldRequired
													: localization.auth.invalidEmail;

												setFieldErrors((prev) => ({
													...prev,
													email: msg,
												}));
											}}
											aria-invalid={!!fieldErrors.email}
										/>

										<FieldError>{fieldErrors.email}</FieldError>
									</Field>

									<Field data-invalid={!!fieldErrors.password}>
										<div className="flex items-center justify-between gap-3">
											<Label htmlFor="password">
												{localization.auth.password}
											</Label>

											{emailAndPassword.forgotPassword && (
												<Link
													href={`${basePaths.auth}/${viewPaths.auth.forgotPassword}`}
													className="text-muted-foreground text-xs underline-offset-4 transition-colors hover:text-foreground hover:underline"
												>
													{localization.auth.forgotPasswordLink}
												</Link>
											)}
										</div>

										<Input
											id="password"
											name="password"
											type="password"
											autoComplete="current-password"
											value={password}
											onChange={(e) => {
												setPassword(e.target.value);

												setFieldErrors((prev) => ({
													...prev,
													password: undefined,
												}));
											}}
											placeholder="Password"
											required
											minLength={emailAndPassword?.minPasswordLength}
											maxLength={emailAndPassword?.maxPasswordLength}
											disabled={isPending}
											onInvalid={(e) => {
												e.preventDefault();
												const el = e.target as HTMLInputElement;
												const min = emailAndPassword?.minPasswordLength;
												const max = emailAndPassword?.maxPasswordLength;
												const msg = el.validity.valueMissing
													? localization.auth.fieldRequired
													: el.validity.tooShort
														? localization.auth.tooShort.replace(
																"{{min}}",
																String(min),
															)
														: localization.auth.tooLong.replace(
																"{{max}}",
																String(max),
															);

												setFieldErrors((prev) => ({
													...prev,
													password: msg,
												}));
											}}
											aria-invalid={!!fieldErrors.password}
										/>

										<FieldError>{fieldErrors.password}</FieldError>
									</Field>

									{emailAndPassword.rememberMe && (
										<Field className="my-1">
											<div className="flex items-center gap-3">
												<Checkbox
													id="rememberMe"
													name="rememberMe"
													disabled={isPending}
												/>

												<Label
													htmlFor="rememberMe"
													className="cursor-pointer text-sm font-normal"
												>
													{localization.auth.rememberMe}
												</Label>
											</div>
										</Field>
									)}

									{Captcha && (
										<div className="flex justify-center">{Captcha}</div>
									)}

									<div className="flex flex-col gap-3 pt-1">
										<Button
											type="submit"
											disabled={isPending}
											className="h-10 w-full active:scale-[0.985]"
										>
											{signInEmailPending && <Spinner />}

											{localization.auth.signIn}
										</Button>

										{plugins.flatMap((plugin) =>
											(plugin.authButtons ?? []).map((AuthButton, index) => (
												<AuthButton
													key={`${plugin.id}-${index.toString()}`}
													view="signIn"
												/>
											)),
										)}
									</div>
								</FieldGroup>
							</form>
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
