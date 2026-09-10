import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";

import "@/styles/app.css";

import { Providers } from "@/components/providers";
import { ThemeProvider, ThemeScript } from "@/components/theme-provider";
import { getEnabledSocialProviderIds } from "@/lib/auth-social-providers";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: "Nevin",
	description: "A Next.js starter for auth-first product apps.",
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

	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn("font-sans", geist.variable)}
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
					<Providers socialProviders={socialProviders}>{children}</Providers>
				</ThemeProvider>
			</body>
		</html>
	);
}
