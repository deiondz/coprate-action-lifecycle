"use client";

import { authMutationKeys } from "@better-auth-ui/core";
import {
	type UsernameAuthClient,
	useAuth,
	useAuthPlugin,
	useFetchOptions,
	useSignInEmail,
	useSignInUsername,
} from "@better-auth-ui/react";
import { useIsMutating } from "@tanstack/react-query";
import {
	type Dispatch,
	type SetStateAction,
	type SyntheticEvent,
	useState,
} from "react";
import {
	ProviderButtons,
	type SocialLayout,
} from "@/components/auth/provider-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { usernamePlugin } from "@/lib/auth/username-plugin";
import { cn } from "@/lib/utils";

export type SignInUsernameProps = {
	className?: string;
	socialLayout?: SocialLayout;
	socialPosition?: "top" | "bottom";
};

function isEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type SignInFieldErrors = {
	email?: string;
	password?: string;
};

function SignInSocialSection({
	placement,
	socialLayout,
	socialPosition,
}: {
	placement: "top" | "bottom";
	socialLayout?: SocialLayout;
	socialPosition: "top" | "bottom";
}) {
	const { emailAndPassword, localization, socialProviders } = useAuth();
	if (placement !== socialPosition) return null;

	const providers = socialProviders?.length ? (
		<ProviderButtons socialLayout={socialLayout} />
	) : null;
	const separator =
		emailAndPassword?.enabled && socialProviders?.length ? (
			<FieldSeparator
				className={cn(
					"*:data-[slot=field-separator-content]:bg-card text-xs flex items-center",
					placement === "top" && "m-0",
				)}
			>
				{localization.auth.or}
			</FieldSeparator>
		) : null;

	return placement === "top" ? (
		<>
			{providers}
			{separator}
		</>
	) : (
		<>
			{separator}
			{providers}
		</>
	);
}

function UsernameCredentialsForm({
	fieldErrors,
	isPending,
	isSignInPending,
	onSubmit,
	password,
	setFieldErrors,
	setPassword,
}: {
	fieldErrors: SignInFieldErrors;
	isPending: boolean;
	isSignInPending: boolean;
	onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
	password: string;
	setFieldErrors: Dispatch<SetStateAction<SignInFieldErrors>>;
	setPassword: (password: string) => void;
}) {
	const { emailAndPassword, localization, plugins } = useAuth();
	const { localization: usernameLocalization } = useAuthPlugin(usernamePlugin);
	if (!emailAndPassword?.enabled) return null;

	const Captcha = plugins.find(
		(plugin) => plugin.captchaComponent,
	)?.captchaComponent;
	return (
		<form onSubmit={onSubmit}>
			<FieldGroup>
				<Field data-invalid={!!fieldErrors.email}>
					<Label htmlFor="email">{usernameLocalization.username}</Label>
					<Input
						id="email"
						name="email"
						type="text"
						autoComplete="username"
						placeholder={usernameLocalization.usernameOrEmailPlaceholder}
						required
						disabled={isPending}
						onChange={() => {
							setFieldErrors((previous) => ({
								...previous,
								email: undefined,
							}));
						}}
						onInvalid={(event) => {
							event.preventDefault();
							setFieldErrors((previous) => ({
								...previous,
								email: localization.auth.fieldRequired,
							}));
						}}
						aria-invalid={!!fieldErrors.email}
					/>
					<FieldError>{fieldErrors.email}</FieldError>
				</Field>

				<Field data-invalid={!!fieldErrors.password}>
					<Label htmlFor="password">{localization.auth.password}</Label>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete="current-password"
						value={password}
						onChange={(event) => {
							setPassword(event.target.value);
							setFieldErrors((previous) => ({
								...previous,
								password: undefined,
							}));
						}}
						placeholder={localization.auth.passwordPlaceholder}
						required
						minLength={emailAndPassword.minPasswordLength}
						maxLength={emailAndPassword.maxPasswordLength}
						disabled={isPending}
						onInvalid={(event) => {
							event.preventDefault();
							const input = event.target as HTMLInputElement;
							const message = input.validity.valueMissing
								? localization.auth.fieldRequired
								: input.validity.tooShort
									? localization.auth.tooShort.replace(
											"{{min}}",
											String(emailAndPassword.minPasswordLength),
										)
									: localization.auth.tooLong.replace(
											"{{max}}",
											String(emailAndPassword.maxPasswordLength),
										);
							setFieldErrors((previous) => ({
								...previous,
								password: message,
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
				{Captcha && <div className="flex justify-center">{Captcha}</div>}
				<div className="flex flex-col gap-3">
					<Button type="submit" disabled={isPending}>
						{isSignInPending && <Spinner />}
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
	);
}

function SignInLinks() {
	const { basePaths, emailAndPassword, localization, viewPaths, Link } =
		useAuth();
	if (!emailAndPassword?.enabled) return null;
	return (
		<div className="flex flex-col gap-3 items-center w-full mt-4">
			{emailAndPassword.forgotPassword && (
				<Link
					href={`${basePaths.auth}/${viewPaths.auth.forgotPassword}`}
					className="self-center text-sm underline-offset-4 hover:underline"
				>
					{localization.auth.forgotPasswordLink}
				</Link>
			)}
			<FieldDescription className="text-center">
				{localization.auth.needToCreateAnAccount}{" "}
				<Link
					href={`${basePaths.auth}/${viewPaths.auth.signUp}`}
					className="underline underline-offset-4"
				>
					{localization.auth.signUp}
				</Link>
			</FieldDescription>
		</div>
	);
}

/**
 * Render the username-based sign-in form. Identical to the built-in `<SignIn>`
 * design but routes non-email inputs through `signInUsername` instead of
 * `signInEmail`.
 */
export function SignInUsername({
	className,
	socialLayout,
	socialPosition = "bottom",
}: SignInUsernameProps) {
	const {
		authClient,
		basePaths,
		emailAndPassword,
		localization,
		redirectTo,
		viewPaths,
		navigate,
	} = useAuth();

	const { fetchOptions, resetFetchOptions } = useFetchOptions();

	const [password, setPassword] = useState("");

	const { mutate: signInEmail, isPending: isSignInEmailPending } =
		useSignInEmail(authClient, {
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
			onSuccess: () => {
				sessionStorage.removeItem("better-auth-ui.verify-email");
				navigate({ to: redirectTo });
			},
		});

	const { mutate: signInUsername, isPending: isSignInUsernamePending } =
		useSignInUsername(authClient as UsernameAuthClient, {
			onError: (error) => {
				setPassword("");

				if (error.error?.code === "EMAIL_NOT_VERIFIED") {
					sessionStorage.removeItem("better-auth-ui.verify-email");

					navigate({
						to: `${basePaths.auth}/${viewPaths.auth.verifyEmail}`,
					});
				}

				resetFetchOptions();
			},
			onSuccess: () => {
				sessionStorage.removeItem("better-auth-ui.verify-email");
				navigate({ to: redirectTo });
			},
		});

	const signInMutating = useIsMutating({
		mutationKey: authMutationKeys.signIn.all,
	});
	const signUpMutating = useIsMutating({
		mutationKey: authMutationKeys.signUp.all,
	});
	const isPending = signInMutating + signUpMutating > 0;
	const isSignInPending = isSignInEmailPending || isSignInUsernamePending;

	const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});

	const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const email = formData.get("email") as string;
		const rememberMe = formData.get("rememberMe") === "on";

		if (isEmail(email)) {
			signInEmail({
				email,
				password,
				...(emailAndPassword?.rememberMe ? { rememberMe } : {}),
				fetchOptions,
			});
		} else {
			signInUsername({
				username: email,
				password,
				...(emailAndPassword?.rememberMe ? { rememberMe } : {}),
				fetchOptions,
			});
		}
	};

	return (
		<Card className={cn("w-full max-w-sm", className)}>
			<CardHeader>
				<CardTitle className="text-xl font-semibold">
					{localization.auth.signIn}
				</CardTitle>
			</CardHeader>

			<CardContent>
				<div className="flex flex-col gap-6">
					<SignInSocialSection
						placement="top"
						socialLayout={socialLayout}
						socialPosition={socialPosition}
					/>
					<UsernameCredentialsForm
						fieldErrors={fieldErrors}
						isPending={isPending}
						isSignInPending={isSignInPending}
						onSubmit={handleSubmit}
						password={password}
						setFieldErrors={setFieldErrors}
						setPassword={setPassword}
					/>
					<SignInSocialSection
						placement="bottom"
						socialLayout={socialLayout}
						socialPosition={socialPosition}
					/>
				</div>
				<SignInLinks />
			</CardContent>
		</Card>
	);
}
