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
import { Eye, EyeSlash as EyeOff } from "@phosphor-icons/react/dist/ssr";
import { useIsMutating } from "@tanstack/react-query";
import {
	type Dispatch,
	type SetStateAction,
	type SyntheticEvent,
	useState,
} from "react";
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

type SignUpFieldErrors = {
	name?: string;
	lastName?: string;
	email?: string;
	password?: string;
	confirmPassword?: string;
};

type SetSignUpFieldErrors = Dispatch<SetStateAction<SignUpFieldErrors>>;

function SignUpNameFields({
	fieldErrors,
	isPending,
	setFieldErrors,
}: {
	fieldErrors: SignUpFieldErrors;
	isPending: boolean;
	setFieldErrors: SetSignUpFieldErrors;
}) {
	const { localization } = useAuth();
	return (
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
						setFieldErrors((previous) => ({
							...previous,
							name: undefined,
						}));
					}}
					onInvalid={(event) => {
						event.preventDefault();
						setFieldErrors((previous) => ({
							...previous,
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
						setFieldErrors((previous) => ({
							...previous,
							lastName: undefined,
						}));
					}}
					onInvalid={(event) => {
						event.preventDefault();
						setFieldErrors((previous) => ({
							...previous,
							lastName: localization.auth.fieldRequired,
						}));
					}}
					aria-invalid={!!fieldErrors.lastName}
				/>
				<FieldError>{fieldErrors.lastName}</FieldError>
			</Field>
		</div>
	);
}

function SignUpEmailField({
	error,
	isPending,
	setFieldErrors,
}: {
	error?: string;
	isPending: boolean;
	setFieldErrors: SetSignUpFieldErrors;
}) {
	const { localization } = useAuth();
	return (
		<Field data-invalid={!!error}>
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
					setFieldErrors((previous) => ({
						...previous,
						email: undefined,
					}));
				}}
				onInvalid={(event) => {
					event.preventDefault();
					const input = event.target as HTMLInputElement;
					setFieldErrors((previous) => ({
						...previous,
						email: input.validity.valueMissing
							? localization.auth.fieldRequired
							: localization.auth.invalidEmail,
					}));
				}}
				aria-invalid={!!error}
			/>
			<FieldError>{error}</FieldError>
		</Field>
	);
}

function SignUpPasswordField({
	description,
	error,
	id,
	isPending,
	label,
	placeholder,
	setFieldErrors,
	setValue,
	value,
}: {
	description?: React.ReactNode;
	error?: string;
	id: "password" | "confirmPassword";
	isPending: boolean;
	label: string;
	placeholder: string;
	setFieldErrors: SetSignUpFieldErrors;
	setValue: (value: string) => void;
	value: string;
}) {
	const { emailAndPassword, localization } = useAuth();
	const [isVisible, setIsVisible] = useState(false);
	return (
		<Field data-invalid={!!error}>
			<Label htmlFor={id}>{label}</Label>
			<InputGroup>
				<InputGroupInput
					id={id}
					name={id}
					type={isVisible ? "text" : "password"}
					autoComplete="new-password"
					value={value}
					onChange={(event) => {
						setValue(event.target.value);
						setFieldErrors((previous) => ({
							...previous,
							[id]: undefined,
						}));
					}}
					placeholder={placeholder}
					required
					minLength={emailAndPassword?.minPasswordLength}
					maxLength={emailAndPassword?.maxPasswordLength}
					disabled={isPending}
					onInvalid={(event) => {
						event.preventDefault();
						const input = event.target as HTMLInputElement;
						const message = input.validity.valueMissing
							? localization.auth.fieldRequired
							: input.validity.tooShort
								? localization.auth.tooShort.replace(
										"{{min}}",
										String(emailAndPassword?.minPasswordLength),
									)
								: localization.auth.tooLong.replace(
										"{{max}}",
										String(emailAndPassword?.maxPasswordLength),
									);
						setFieldErrors((previous) => ({
							...previous,
							[id]: message,
						}));
					}}
					aria-invalid={!!error}
				/>
				<InputGroupAddon align="inline-end">
					<InputGroupButton
						aria-label={
							isVisible
								? localization.auth.hidePassword
								: localization.auth.showPassword
						}
						title={
							isVisible
								? localization.auth.hidePassword
								: localization.auth.showPassword
						}
						onClick={() => setIsVisible(!isVisible)}
					>
						{isVisible ? <EyeOff /> : <Eye />}
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
			{description}
			<FieldError>{error}</FieldError>
		</Field>
	);
}

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
	const hasSocialProviders = Boolean(socialProviders?.length);
	const showSeparator = emailAndPassword?.enabled && hasSocialProviders;

	const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});

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

	return (
		<div
			className={cn(
				"mat-well flex w-full flex-col rounded-[14px] p-2 lg:max-w-[420px]",
				className,
			)}
		>
			<Card className="mat-panel overflow-hidden rounded-[11px] border-0 pb-0 shadow-none before:hidden">
				<CardHeader className="justify-items-start gap-2 px-6 pb-5 pt-7 text-left">
					<Logo className="mb-4 h-7" />
					<CardTitle className="text-[26px] font-medium leading-none tracking-[-0.035em]">
						Start your free trial
					</CardTitle>
					<CardDescription className="max-w-[32ch] text-pretty text-[13.5px] leading-6 text-ink-2">
						Create your account to start organizing corporate actions with a
						clear audit trail.
					</CardDescription>
				</CardHeader>

				<CardContent className="px-6 pb-6 pt-0">
					<div className="flex flex-col gap-5">
						{hasSocialProviders && (
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
									{emailAndPassword.name !== false && (
										<SignUpNameFields
											fieldErrors={fieldErrors}
											isPending={isPending}
											setFieldErrors={setFieldErrors}
										/>
									)}

									<SignUpEmailField
										error={fieldErrors.email}
										isPending={isPending}
										setFieldErrors={setFieldErrors}
									/>

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

									<SignUpPasswordField
										description={
											<FieldDescription>
												Minimum {emailAndPassword.minPasswordLength ?? 8}{" "}
												characters.
											</FieldDescription>
										}
										error={fieldErrors.password}
										id="password"
										isPending={isPending}
										label={localization.auth.password}
										placeholder="Password"
										setFieldErrors={setFieldErrors}
										setValue={setPassword}
										value={password}
									/>

									{emailAndPassword?.confirmPassword && (
										<SignUpPasswordField
											error={fieldErrors.confirmPassword}
											id="confirmPassword"
											isPending={isPending}
											label={localization.auth.confirmPassword}
											placeholder="Password"
											setFieldErrors={setFieldErrors}
											setValue={setConfirmPassword}
											value={confirmPassword}
										/>
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

						{!emailAndPassword?.enabled &&
							plugins.flatMap((plugin) =>
								(plugin.authButtons ?? []).map((AuthButton, index) => (
									<AuthButton
										key={`${plugin.id}-${index.toString()}`}
										view="signUp"
									/>
								)),
							)}
					</div>
				</CardContent>

				{emailAndPassword?.enabled && (
					<CardFooter className="mt-auto justify-center border-hairline border-t bg-sub px-6 py-5">
						<FieldDescription className="text-center text-base leading-6 md:text-sm">
							{localization.auth.alreadyHaveAnAccount}{" "}
							<Link
								href={`${basePaths.auth}/${viewPaths.auth.signIn}`}
								className="font-medium text-foreground underline underline-offset-4"
							>
								{localization.auth.signIn}
							</Link>
						</FieldDescription>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}
