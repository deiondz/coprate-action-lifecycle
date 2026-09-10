"use client";

import { authQueryKeys } from "@better-auth-ui/core";
import {
	useAuth,
	useAuthPlugin,
	useDeleteUser,
	useListAccounts,
} from "@better-auth-ui/react";
import { Warning as TriangleAlert } from "@phosphor-icons/react/dist/ssr";
import { useQueryClient } from "@tanstack/react-query";
import { type SyntheticEvent, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { deleteUserPlugin } from "@/lib/auth/delete-user-plugin";
import { cn } from "@/lib/utils";

export type DeleteAccountProps = {
	className?: string;
};

/**
 * Danger-zone card to delete the authenticated account, with a confirmation dialog and toasts.
 */
export function DeleteAccount({ className }: DeleteAccountProps) {
	const { authClient, basePaths, localization, viewPaths, navigate } =
		useAuth();

	const {
		localization: deleteUserLocalization,
		sendDeleteAccountVerification,
	} = useAuthPlugin(deleteUserPlugin);

	const { data: accounts } = useListAccounts(authClient);

	const queryClient = useQueryClient();

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [password, setPassword] = useState("");

	const hasCredentialAccount = accounts?.some(
		(account) => account.providerId === "credential",
	);
	const needsPassword = !sendDeleteAccountVerification && hasCredentialAccount;

	const { mutate: deleteUser, isPending } = useDeleteUser(authClient);

	const handleDialogOpenChange = (open: boolean) => {
		setConfirmOpen(open);
		setPassword("");
	};

	const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		const params = {
			...(needsPassword ? { password } : {}),
		};

		deleteUser(params, {
			onSuccess: () => {
				setConfirmOpen(false);
				setPassword("");

				if (sendDeleteAccountVerification) {
					toast.success(deleteUserLocalization.deleteUserVerificationSent);
				} else {
					toast.success(deleteUserLocalization.deleteUserSuccess);
					queryClient.removeQueries({ queryKey: authQueryKeys.all });
					navigate({
						to: `${basePaths.auth}/${viewPaths.auth.signIn}`,
						replace: true,
					});
				}
			},
		});
	};

	return (
		<Card className={cn("border-destructive", className)}>
			<CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-medium leading-tight">
						{deleteUserLocalization.deleteAccount}
					</p>

					<p className="text-muted-foreground text-xs mt-0.5">
						{deleteUserLocalization.deleteAccountDescription}
					</p>
				</div>

				<AlertDialog open={confirmOpen} onOpenChange={handleDialogOpenChange}>
					<AlertDialogTrigger
						className={cn(
							buttonVariants({ variant: "destructive", size: "sm" }),
						)}
						disabled={!accounts}
					>
						{deleteUserLocalization.deleteAccount}
					</AlertDialogTrigger>

					<AlertDialogContent>
						<form onSubmit={handleSubmit} className="flex flex-col">
							<AlertDialogHeader
								className={needsPassword ? "pb-4 sm:pb-4" : undefined}
							>
								<AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
									<TriangleAlert />
								</AlertDialogMedia>

								<AlertDialogTitle>
									{deleteUserLocalization.deleteAccount}
								</AlertDialogTitle>

								<AlertDialogDescription>
									{deleteUserLocalization.deleteAccountDescription}
								</AlertDialogDescription>
							</AlertDialogHeader>

							{needsPassword ? (
								<div className="px-6 pb-6">
									<Field className="w-full">
										<FieldLabel
											htmlFor="delete-password"
											className="leading-normal"
										>
											{localization.auth.password}
										</FieldLabel>

										<Input
											id="delete-password"
											name="password"
											type="password"
											autoComplete="current-password"
											placeholder={localization.auth.passwordPlaceholder}
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											disabled={isPending}
											required
										/>

										<FieldError />
									</Field>
								</div>
							) : null}

							<AlertDialogFooter>
								<AlertDialogCancel disabled={isPending}>
									{localization.settings.cancel}
								</AlertDialogCancel>

								<Button
									type="submit"
									variant="destructive"
									disabled={isPending}
								>
									{isPending && <Spinner />}

									{deleteUserLocalization.deleteAccount}
								</Button>
							</AlertDialogFooter>
						</form>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	);
}
