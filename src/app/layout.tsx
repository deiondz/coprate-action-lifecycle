import type { Metadata, Viewport } from "next";
import { DynaPuff, Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "@/styles/app.css";

import { Providers } from "@/components/providers";
import { ThemeProvider, ThemeScript } from "@/components/theme-provider";
import { getEnabledSocialProviderIds } from "@/lib/auth-social-providers";
import { isZeptoMailConfigured } from "@/lib/email-delivery";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});
const dynaPuff = DynaPuff({
	subsets: ["latin"],
	variable: "--font-dyna-puff",
});

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#141312" },
	],
};

export const metadata: Metadata = {
	title: "Drishti",
	description:
		"Track corporate actions as source-linked, continuously updated lifecycles.",
	icons: {
		icon: "/favicon.ico",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const socialProviders = getEnabledSocialProviderIds();
	const emailDeliveryEnabled = isZeptoMailConfigured();

	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn(
				"font-sans",
				geist.variable,
				geistMono.variable,
				dynaPuff.variable,
			)}
		>
			<head>
				<ThemeScript />
			</head>
			<body className="antialiased min-h-svh flex flex-col">
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange
				>
					<Providers
						emailDeliveryEnabled={emailDeliveryEnabled}
						socialProviders={socialProviders}
					>
						{children}
					</Providers>
				</ThemeProvider>
			</body>
		</html>
	);
}
