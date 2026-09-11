"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const PRESS = {
	type: "spring",
	stiffness: 520,
	damping: 34,
	mass: 0.45,
} as const;

export type UsePressDepthOptions = {
	disabled?: boolean;
	onPressStart?: () => void;
	onPressEnd?: () => void;
};

export type PressOrigin = { x: number; y: number };

export function usePressDepth(options: UsePressDepthOptions = {}) {
	const { disabled = false, onPressStart, onPressEnd } = options;
	const [pressed, setPressed] = useState(false);
	const [tracking, setTracking] = useState(false);
	const [origin, setOrigin] = useState<PressOrigin | null>(null);
	const node = useRef<HTMLElement | null>(null);
	const pointer = useRef<number | null>(null);
	const down = useRef(false);
	const began = useRef(onPressStart);
	const ended = useRef(onPressEnd);
	began.current = onPressStart;
	ended.current = onPressEnd;

	const setDown = useCallback((next: boolean) => {
		if (down.current === next) return;
		down.current = next;
		setPressed(next);
		if (next) began.current?.();
		else ended.current?.();
	}, []);

	const stop = useCallback(() => {
		pointer.current = null;
		setTracking(false);
		setOrigin(null);
		setDown(false);
	}, [setDown]);

	useEffect(() => {
		if (!tracking) return;
		const contains = (event: PointerEvent) => {
			const element = node.current;
			if (!element) return false;
			const rect = element.getBoundingClientRect();
			return (
				event.clientX >= rect.left &&
				event.clientX <= rect.right &&
				event.clientY >= rect.top &&
				event.clientY <= rect.bottom
			);
		};
		const move = (event: PointerEvent) => {
			if (event.pointerId === pointer.current) setDown(contains(event));
		};
		const lift = (event: PointerEvent) => {
			if (event.pointerId === pointer.current) stop();
		};
		const hidden = () => {
			if (document.hidden) stop();
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", lift);
		window.addEventListener("pointercancel", lift);
		window.addEventListener("blur", stop);
		document.addEventListener("visibilitychange", hidden);
		return () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", lift);
			window.removeEventListener("pointercancel", lift);
			window.removeEventListener("blur", stop);
			document.removeEventListener("visibilitychange", hidden);
		};
	}, [tracking, setDown, stop]);

	useEffect(() => {
		if (disabled) stop();
	}, [disabled, stop]);

	const ref = useCallback((next: HTMLElement | null) => {
		node.current = next;
	}, []);

	return {
		pressed,
		origin,
		ref,
		bind: {
			onPointerDown: (event: React.PointerEvent) => {
				if (disabled || (event.pointerType === "mouse" && event.button !== 0))
					return;
				const rect = event.currentTarget.getBoundingClientRect();
				setOrigin({
					x: Math.max(
						-1,
						Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
					),
					y: Math.max(
						-1,
						Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
					),
				});
				pointer.current = event.pointerId;
				setTracking(true);
				setDown(true);
			},
			onKeyDown: (event: React.KeyboardEvent) => {
				if (
					!disabled &&
					!event.repeat &&
					(event.key === " " || event.key === "Enter")
				)
					setDown(true);
			},
			onKeyUp: (event: React.KeyboardEvent) => {
				if (
					event.key === " " ||
					event.key === "Enter" ||
					event.key === "Escape"
				)
					setDown(false);
			},
			onBlur: stop,
		},
	};
}

export type PressDepthProps = {
	children: React.ReactNode;
	depth?: number;
	tilt?: number;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
	className?: string;
	"aria-label"?: string;
};

export function PressDepth({
	children,
	depth = 4,
	tilt = 7,
	disabled = false,
	type = "button",
	onClick,
	className = "",
	"aria-label": ariaLabel,
}: PressDepthProps) {
	const reduced = useReducedMotion();
	const { pressed, origin, ref, bind } = usePressDepth({ disabled });
	const lean = pressed && origin && !reduced ? origin : null;
	return (
		<button
			ref={ref}
			type={type}
			disabled={disabled}
			aria-label={ariaLabel}
			data-pressed={pressed ? "" : undefined}
			onClick={onClick}
			style={{
				paddingBottom: depth,
				touchAction: "manipulation",
				WebkitTapHighlightColor: "transparent",
			}}
			className="group relative inline-flex select-none rounded-[9px] align-middle outline-none disabled:opacity-50"
			{...bind}
		>
			<span
				aria-hidden
				style={{ top: depth }}
				className="absolute inset-x-0 bottom-0 rounded-[9px] bg-stone-300 dark:bg-white/25"
			/>
			<motion.span
				initial={false}
				animate={{
					y: pressed ? depth : 0,
					rotateX: lean ? -lean.y * tilt : 0,
					rotateY: lean ? lean.x * tilt : 0,
				}}
				transition={reduced ? { duration: 0 } : PRESS}
				style={{ transformPerspective: 340 }}
				className={`relative inline-flex h-9 items-center justify-center gap-2 rounded-[9px] border border-stone-200 bg-white px-3.5 text-[13px] font-medium text-stone-700 group-focus-visible:ring-2 group-focus-visible:ring-stone-400 dark:border-white/[0.16] dark:bg-[#1D1D1A] dark:text-stone-200 dark:group-focus-visible:ring-stone-500 ${className}`}
			>
				<motion.span
					aria-hidden
					initial={false}
					animate={{ opacity: pressed ? 0 : 1 }}
					transition={reduced ? { duration: 0 } : PRESS}
					className="pointer-events-none absolute inset-0 rounded-[9px] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(28,25,23,0.06)] dark:shadow-[inset_0_1.5px_0_rgba(255,255,255,0.09)]"
				/>
				{children}
			</motion.span>
		</button>
	);
}
