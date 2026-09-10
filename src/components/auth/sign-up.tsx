"use client";

import {
	authMutationKeys,
	parseAdditionalFieldValue,
} from "@better-auth-ui/core";
import {
	useAuth,
	useFetchOptions,
	useSignUpEmail,
} from "@better-auth-ui/react";
import {
	Eye,
	EyeSlash as EyeOff,
	LockKey as LockKeyhole,
	ShieldCheck,
	UserCircle as UserRound,
} from "@phosphor-icons/react/dist/ssr";
import { useIsMutating } from "@tanstack/react-query";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { AdditionalField } from "./additional-field";
import { ProviderButtons, type SocialLayout } from "./provider-buttons";

export type SignUpProps = {
	className?: string;
	socialLayout?: SocialLayout;
	socialPosition?: "top" | "bottom";
};

/**
 * Renders a sign-up form with name, email, and password fields, optional social provider buttons, and submission handling.
 *
 * Submits credentials to the configured auth client and handles the response:
 * - If email verification is required, shows a notification and navigates to sign-in
 * - On success, refreshes the session and navigates to the configured redirect path
 * - On failure, displays error toasts
 * - Manages a pending state while the request is in-flight
 *
 * @param className - Additional CSS classes applied to the outer container
 * @param socialLayout - Social layout to apply to the component
 * @param socialPosition - Social position to apply to the component
 * @returns The sign-up form React element.
 */
export function SignUp({ className, socialLayout }: SignUpProps) {
	const {
		additionalFields,
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
	const [confirmPassword, setConfirmPassword] = useState("");

	const { mutate: signUpEmail, isPending: signUpEmailPending } = useSignUpEmail(
		authClient,
		{
			onError: () => {
				setPassword("");
				setConfirmPassword("");
				resetFetchOptions();
			},
			onSuccess: (_data, { email }) => {
				if (emailAndPassword?.requireEmailVerification) {
					sessionStorage.setItem("better-auth-ui.verify-email", email);
					navigate({
						to: `${basePaths.auth}/${viewPaths.auth.verifyEmail}`,
					});
				} else {
					navigate({ to: redirectTo });
				}
			},
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

	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
		useState(false);

	const [fieldErrors, setFieldErrors] = useState<{
		name?: string;
		lastName?: string;
		email?: string;
		password?: string;
		confirmPassword?: string;
	}>({});

	const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		// `emailAndPassword.name === false` hides the name field and submits "".
		const firstName =
			(formData.get("firstName") as string | null)?.trim() ?? "";
		const lastName = (formData.get("lastName") as string | null)?.trim() ?? "";
		const name =
			emailAndPassword?.name === false
				? ""
				: [firstName, lastName].filter(Boolean).join(" ");
		const email = formData.get("email") as string;

		if (emailAndPassword?.confirmPassword && password !== confirmPassword) {
			toast.error(localization.auth.passwordsDoNotMatch);
			setPassword("");
			setConfirmPassword("");
			return;
		}

		const additionalFieldValues: Record<string, unknown> = {};

		for (const field of additionalFields ?? []) {
			if (!field.signUp || field.readOnly) continue;
			const value = parseAdditionalFieldValue(
				field,
				formData.get(field.name) as string | null,
			);

			if (field.validate) {
				try {
					await field.validate(value);
				} catch (error) {
					toast.error(error instanceof Error ? error.message : String(error));
					return;
				}
			}

			if (value !== undefined) {
				additionalFieldValues[field.name] = value;
			}
		}

		signUpEmail({
			name,
			email,
			password,
			...additionalFieldValues,
			fetchOptions,
		});
	};

	const showSeparator =
		emailAndPassword?.enabled && socialProviders && socialProviders.length > 0;

	return (
		<main
			className={cn(
				"mx-auto flex min-h-0 w-full max-w-screen-sm flex-col md:max-w-screen-lg md:flex-row",
				className,
			)}
		>
			<section className="flex flex-col justify-center items-start p-6 pb-4 md:w-1/2 md:p-8">
				<Logo className="mb-6 h-9" />

				<h1 className="mb-4 max-w-md text-2xl font-semibold leading-tight tracking-normal md:text-3xl">
					Start your free trial
				</h1>

				<p className="mb-0 max-w-md text-muted-foreground leading-7 md:mb-8">
					Create your account and unlock the workspace tools built to keep your
					team moving.
				</p>

				<div className="hidden space-y-6 md:block">
					<FeatureItem
						icon={<UserRound />}
						title="Seamless onboarding"
						description="Start with a focused setup flow that keeps the path clear from the first step."
					/>
					<FeatureItem
						icon={<ShieldCheck />}
						title="Built-in confidence"
						description="Account flows stay predictable, validated, and easy to recover from when something needs attention."
					/>
					<FeatureItem
						icon={<LockKeyhole />}
						title="Secure by default"
						description="Password and provider sign-up stay inside the same trusted, auditable auth surface."
					/>
				</div>
			</section>

			<section className="flex items-center justify-center p-6 pt-0 md:w-1/2 md:p-8">
				<div className="flex w-full flex-col gap-y-4 md:max-w-lg md:rounded-2xl md:border md:bg-card md:p-8 md:shadow-xs/5">
					{emailAndPassword?.enabled && (
						<form onSubmit={handleSubmit}>
							<FieldGroup className="gap-4">
								{emailAndPassword.name !== false && (
									<div className="grid gap-4 sm:grid-cols-2">
										<Field data-invalid={!!fieldErrors.name}>
											<Label htmlFor="firstName">First name</Label>

											<Input
												id="firstName"
												name="firstName"
												type="text"
												autoComplete="given-name"
												placeholder="First name"
												required
												disabled={isPending}
												onChange={() => {
													setFieldErrors((prev) => ({
														...prev,
														name: undefined,
													}));
												}}
												onInvalid={(e) => {
													e.preventDefault();

													setFieldErrors((prev) => ({
														...prev,
														name: localization.auth.fieldRequired,
													}));
												}}
												aria-invalid={!!fieldErrors.name}
											/>

											<FieldError>{fieldErrors.name}</FieldError>
										</Field>

										<Field data-invalid={!!fieldErrors.lastName}>
											<Label htmlFor="lastName">Last name</Label>

											<Input
												id="lastName"
												name="lastName"
												type="text"
												autoComplete="family-name"
												placeholder="Last name"
												required
												disabled={isPending}
												onChange={() => {
													setFieldErrors((prev) => ({
														...prev,
														lastName: undefined,
													}));
												}}
												onInvalid={(e) => {
													e.preventDefault();

													setFieldErrors((prev) => ({
														...prev,
														lastName: localization.auth.fieldRequired,
													}));
												}}
												aria-invalid={!!fieldErrors.lastName}
											/>

											<FieldError>{fieldErrors.lastName}</FieldError>
										</Field>
									</div>
								)}

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

								{additionalFields?.map(
									(field) =>
										field.signUp === "above" && (
											<AdditionalField
												key={field.name}
												name={field.name}
												field={field}
												isPending={isPending}
											/>
										),
								)}

								<Field data-invalid={!!fieldErrors.password}>
									<Label htmlFor="password">{localization.auth.password}</Label>

									<InputGroup>
										<InputGroupInput
											id="password"
											name="password"
											type={isPasswordVisible ? "text" : "password"}
											autoComplete="new-password"
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

										<InputGroupAddon align="inline-end">
											<InputGroupButton
												aria-label={
													isPasswordVisible
														? localization.auth.hidePassword
														: localization.auth.showPassword
												}
												title={
													isPasswordVisible
														? localization.auth.hidePassword
														: localization.auth.showPassword
												}
												onClick={() => {
													setIsPasswordVisible(!isPasswordVisible);
												}}
											>
												{isPasswordVisible ? <EyeOff /> : <Eye />}
											</InputGroupButton>
										</InputGroupAddon>
									</InputGroup>

									<FieldDescription>
										Minimum {emailAndPassword?.minPasswordLength ?? 8}{" "}
										characters.
									</FieldDescription>
									<FieldError>{fieldErrors.password}</FieldError>
								</Field>

								{emailAndPassword?.confirmPassword && (
									<Field data-invalid={!!fieldErrors.confirmPassword}>
										<Label htmlFor="confirmPassword">
											{localization.auth.confirmPassword}
										</Label>

										<InputGroup>
											<InputGroupInput
												id="confirmPassword"
												name="confirmPassword"
												type={isConfirmPasswordVisible ? "text" : "password"}
												autoComplete="new-password"
												value={confirmPassword}
												onChange={(e) => {
													setConfirmPassword(e.target.value);

													setFieldErrors((prev) => ({
														...prev,
														confirmPassword: undefined,
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
														confirmPassword: msg,
													}));
												}}
												aria-invalid={!!fieldErrors.confirmPassword}
											/>

											<InputGroupAddon align="inline-end">
												<InputGroupButton
													aria-label={
														isConfirmPasswordVisible
															? localization.auth.hidePassword
															: localization.auth.showPassword
													}
													title={
														isConfirmPasswordVisible
															? localization.auth.hidePassword
															: localization.auth.showPassword
													}
													onClick={() =>
														setIsConfirmPasswordVisible(
															!isConfirmPasswordVisible,
														)
													}
												>
													{isConfirmPasswordVisible ? <EyeOff /> : <Eye />}
												</InputGroupButton>
											</InputGroupAddon>
										</InputGroup>

										<FieldError>{fieldErrors.confirmPassword}</FieldError>
									</Field>
								)}

								{additionalFields?.map(
									(field) =>
										field.signUp &&
										field.signUp !== "above" && (
											<AdditionalField
												key={field.name}
												name={field.name}
												field={field}
												isPending={isPending}
											/>
										),
								)}

								{Captcha && (
									<div className="flex justify-center">{Captcha}</div>
								)}

								<Button
									type="submit"
									disabled={isPending}
									className="h-10 w-full active:scale-[0.985]"
								>
									{signUpEmailPending && <Spinner />}
									{localization.auth.signUp}
								</Button>

								{plugins.flatMap((plugin) =>
									(plugin.authButtons ?? []).map((AuthButton, index) => (
										<AuthButton
											key={`${plugin.id}-${index.toString()}`}
											view="signUp"
										/>
									)),
								)}
							</FieldGroup>
						</form>
					)}

					{emailAndPassword?.enabled && (
						<FieldDescription className="text-center text-sm">
							{localization.auth.alreadyHaveAnAccount}{" "}
							<Link
								href={`${basePaths.auth}/${viewPaths.auth.signIn}`}
								className="font-medium text-primary underline underline-offset-4"
							>
								{localization.auth.signIn}
							</Link>
						</FieldDescription>
					)}

					{showSeparator && (
						<FieldSeparator className="*:data-[slot=field-separator-content]:bg-background my-1 text-xs uppercase md:*:data-[slot=field-separator-content]:bg-card">
							{localization.auth.or}
						</FieldSeparator>
					)}

					{socialProviders && socialProviders.length > 0 && (
						<ProviderButtons socialLayout={socialLayout ?? "grid"} />
					)}
				</div>
			</section>
		</main>
	);
}

function FeatureItem({
	description,
	icon,
	title,
}: {
	description: string;
	icon: React.ReactNode;
	title: string;
}) {
	return (
		<div className="flex items-start gap-4">
			<div className="mt-0.5 text-foreground [&_svg]:size-6">{icon}</div>
			<div>
				<h3 className="mb-2 font-semibold leading-none">{title}</h3>
				<p className="text-muted-foreground text-sm leading-6">{description}</p>
			</div>
		</div>
	);
}
