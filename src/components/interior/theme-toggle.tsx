"use client";

import { Moon, Sun } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/theme-provider";

export function InteriorThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const dark = mounted ? resolvedTheme === "dark" : null;

	return (
		<div
			className="mat-well relative flex h-[26px] w-[54px] items-center rounded-[8px] p-[3px]"
			role="group"
			aria-label="Theme"
		>
			<span
				aria-hidden="true"
				className="mat-cap absolute left-[3px] top-[3px] h-5 w-6 rounded-[5px] transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
				style={{
					transform: dark ? "translateX(24px)" : "translateX(0px)",
					opacity: dark === null ? 0 : 1,
				}}
			/>
			<button
				type="button"
				onClick={() => setTheme("light")}
				aria-label="Use light theme"
				aria-pressed={dark === false}
				className="relative z-10 grid h-5 w-6 place-items-center rounded-[5px] text-ink-3 aria-pressed:text-ink"
			>
				<Sun size={13} weight="fill" aria-hidden="true" />
			</button>
			<button
				type="button"
				onClick={() => setTheme("dark")}
				aria-label="Use dark theme"
				aria-pressed={dark === true}
				className="relative z-10 grid h-5 w-6 place-items-center rounded-[5px] text-ink-3 aria-pressed:text-ink"
			>
				<Moon size={13} weight="fill" aria-hidden="true" />
			</button>
		</div>
	);
}
