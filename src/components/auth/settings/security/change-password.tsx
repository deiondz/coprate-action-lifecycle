"use client";

import {
	useAuth,
	useChangePassword,
	useFetchOptions,
	useListAccounts,
	useRequestPasswordReset,
	useSession,
} from "@better-auth-ui/react";
import { Eye, EyeSlash as EyeOff } from "@phosphor-icons/react/dist/ssr";
import {
	type Dispatch,
	type SetStateAction,
	type SyntheticEvent,
	useState,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type ChangePasswordProps = {
	className?: string;
};

type PasswordFieldErrors = {
	currentPassword?: string;
	newPassword?: string;
	confirmPassword?: string;
};

type SetPasswordFieldErrors = Dispatch<SetStateAction<PasswordFieldErrors>>;

function CurrentPasswordField({
	error,
	isPending,
	isReady,
	localization,
	setFieldErrors,
	setValue,
	value,
}: {
	error?: string;
	isPending: boolean;
	isReady: boolean;
	localization: ReturnType<typeof useAuth>["localization"];
	setFieldErrors: SetPasswordFieldErrors;
	setValue: (value: string) => void;
	value: string;
}) {
	return (
		<Field data-invalid={!!error}>
			<Label htmlFor="currentPassword">
				{localization.settings.currentPassword}
			</Label>
			{isReady ? (
				<Input
					id="currentPassword"
					name="currentPassword"
					type="password"
					autoComplete="current-password"
					placeholder={localization.settings.currentPasswordPlaceholder}
					value={value}
					onChange={(event) => {
						setValue(event.target.value);
						setFieldErrors((previous) => ({
							...previous,
							currentPassword: undefined,
						}));
					}}
					disabled={isPending}
					required
					onInvalid={(event) => {
						event.preventDefault();
						setFieldErrors((previous) => ({
							...previous,
							currentPassword: (event.target as HTMLInputElement)
								.validationMessage,
						}));
					}}
					aria-invalid={!!error}
				/>
			) : (
				<Skeleton>
					<Input className="invisible" />
				</Skeleton>
			)}
			<FieldError>{error}</FieldError>
		</Field>
	);
}

function NewPasswordField({
	autoComplete,
	error,
	id,
	isPending,
	isReady,
	label,
	localization,
	placeholder,
	setFieldErrors,
	setValue,
	value,
}: {
	autoComplete: "new-password";
	error?: string;
	id: "newPassword" | "confirmPassword";
	isPending: boolean;
	isReady: boolean;
	label: string;
	localization: ReturnType<typeof useAuth>["localization"];
	placeholder: string;
	setFieldErrors: SetPasswordFieldErrors;
	setValue: (value: string) => void;
	value: string;
}) {
	const { emailAndPassword } = useAuth();
	const [isVisible, setIsVisible] = useState(false);
	return (
		<Field data-invalid={!!error}>
			<Label htmlFor={id}>{label}</Label>
			{isReady ? (
				<InputGroup>
					<InputGroupInput
						id={id}
						name={id}
						type={isVisible ? "text" : "password"}
						autoComplete={autoComplete}
						placeholder={placeholder}
						value={value}
						onChange={(event) => {
							setValue(event.target.value);
							setFieldErrors((previous) => ({
								...previous,
								[id]: undefined,
							}));
						}}
						minLength={emailAndPassword.minPasswordLength}
						maxLength={emailAndPassword.maxPasswordLength}
						disabled={isPending}
						required
						onInvalid={(event) => {
							event.preventDefault();
							setFieldErrors((previous) => ({
								...previous,
								[id]: (event.target as HTMLInputElement).validationMessage,
							}));
						}}
						aria-invalid={!!error}
					/>
					<InputGroupAddon align="inline-end">
						<InputGroupButton
							size="icon-xs"
							aria-label={
								isVisible
									? localization.auth.hidePassword
									: localization.auth.showPassword
							}
							onClick={() => setIsVisible(!isVisible)}
							disabled={isPending}
						>
							{isVisible ? <EyeOff /> : <Eye />}
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			) : (
				<Skeleton>
					<Input className="invisible" />
				</Skeleton>
			)}
			<FieldError>{error}</FieldError>
		</Field>
	);
}

/**
 * Render a card form for changing the authenticated user's password.
 *
 * When the user has a credential account, displays fields for current password,
 * new password, and optionally confirm password. When the user only has social
 * accounts, displays a prompt to set a password via the reset flow.
 *
 * @returns A JSX element containing the change-password or set-password card
 */
export function ChangePassword({ className }: ChangePasswordProps) {
	const { authClient, emailAndPassword, localization } = useAuth();
	const { data: session } = useSession(authClient);
	const { data: accounts, isPending: isAccountsPending } =
		useListAccounts(authClient);

	const hasCredentialAccount = accounts?.some(
		(account) => account.providerId === "credential",
	);

	if (!isAccountsPending && !hasCredentialAccount) {
		return <SetPassword className={className} />;
	}

	return (
		<ChangePasswordForm
			className={className}
			emailAndPassword={emailAndPassword}
			localization={localization}
			session={isAccountsPending ? undefined : session}
		/>
	);
}

function SetPassword({ className }: { className?: string }) {
	const { authClient, localization, plugins } = useAuth();
	const { data: session } = useSession(authClient);
	const { fetchOptions, resetFetchOptions } = useFetchOptions();

	const { mutate: requestPasswordReset, isPending } = useRequestPasswordReset(
		authClient,
		{
			onError: () => {
				resetFetchOptions();
			},
			onSuccess: () => toast.success(localization.auth.passwordResetEmailSent),
		},
	);

	const Captcha = plugins.find(
		(plugin) => plugin.captchaComponent,
	)?.captchaComponent;

	const handleSetPassword = () => {
		if (!session) return;

		requestPasswordReset({ email: session.user.email, fetchOptions });
	};

	return (
		<div>
			<h2 className="text-sm font-semibold mb-3">
				{localization.settings.changePassword}
			</h2>

			<Card className={cn(className)}>
				<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-sm font-medium leading-tight">
							{localization.settings.setPassword}
						</p>

						<p className="text-muted-foreground text-xs mt-0.5">
							{localization.settings.setPasswordDescription}
						</p>
					</div>

					<div className="flex flex-col gap-3 items-start sm:items-end">
						{Captcha && <div>{Captcha}</div>}

						<Button
							size="sm"
							disabled={isPending || !session?.user.email}
							onClick={handleSetPassword}
						>
							{isPending && <Spinner />}

							{localization.auth.sendResetLink}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function ChangePasswordForm({
	className,
	emailAndPassword,
	localization,
	session,
}: {
	className?: string;
	emailAndPassword: ReturnType<typeof useAuth>["emailAndPassword"];
	localization: ReturnType<typeof useAuth>["localization"];
	session: ReturnType<typeof useSession>["data"];
}) {
	const { authClient } = useAuth();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const { mutate: changePassword, isPending } = useChangePassword(authClient, {
		onError: () => {
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		},
		onSuccess: () => {
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			toast.success(localization.settings.changePasswordSuccess);
		},
	});

	const [fieldErrors, setFieldErrors] = useState<PasswordFieldErrors>({});

	const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (emailAndPassword.confirmPassword && newPassword !== confirmPassword) {
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			toast.error(localization.auth.passwordsDoNotMatch);
			return;
		}

		changePassword({
			currentPassword,
			newPassword,
			revokeOtherSessions: true,
		});
	};

	return (
		<div>
			<h2 className="text-sm font-semibold mb-3">
				{localization.settings.changePassword}
			</h2>

			<form onSubmit={handleSubmit}>
				<Card className={cn(className)}>
					<CardContent className="flex flex-col gap-6">
						<CurrentPasswordField
							error={fieldErrors.currentPassword}
							isPending={isPending}
							isReady={Boolean(session)}
							localization={localization}
							setFieldErrors={setFieldErrors}
							setValue={setCurrentPassword}
							value={currentPassword}
						/>

						<NewPasswordField
							autoComplete="new-password"
							error={fieldErrors.newPassword}
							id="newPassword"
							isPending={isPending}
							isReady={Boolean(session)}
							label={localization.auth.newPassword}
							localization={localization}
							placeholder={localization.auth.newPasswordPlaceholder}
							setFieldErrors={setFieldErrors}
							setValue={setNewPassword}
							value={newPassword}
						/>

						{emailAndPassword.confirmPassword && (
							<NewPasswordField
								autoComplete="new-password"
								error={fieldErrors.confirmPassword}
								id="confirmPassword"
								isPending={isPending}
								isReady={Boolean(session)}
								label={localization.auth.confirmPassword}
								localization={localization}
								placeholder={localization.auth.confirmPasswordPlaceholder}
								setFieldErrors={setFieldErrors}
								setValue={setConfirmPassword}
								value={confirmPassword}
							/>
						)}
					</CardContent>

					<CardFooter>
						<Button type="submit" size="sm" disabled={isPending || !session}>
							{isPending && <Spinner />}

							{localization.settings.updatePassword}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</div>
	);
}
