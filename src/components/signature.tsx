"use client";

import { motion } from "motion/react";
import { parse as parseFont } from "opentype.js";
import { useEffect, useId, useState } from "react";

type SignatureGlyph = {
	advanceWidth?: number;
	getPath: (
		x: number,
		y: number,
		fontSize: number,
	) => {
		getBoundingBox: () => {
			x1: number;
			y1: number;
			x2: number;
			y2: number;
		};
		toPathData: (decimalPlaces?: number) => string;
	};
};

type SignatureFont = {
	unitsPerEm: number;
	charToGlyph: (char: string) => SignatureGlyph;
};

const PATH_DELAY_STEP = 0.2;
const OPACITY_DELAY_OFFSET = 0.01;
const fontCache = new Map<string, SignatureFont>();

type SignatureViewBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

function getFallbackViewBox(text: string, fontSize: number): SignatureViewBox {
	return {
		x: 0,
		y: -fontSize * 0.5,
		width: Math.max(fontSize, text.length * fontSize * 0.55),
		height: fontSize * 1.5,
	};
}

function getFontCacheKey(path: string): string {
	try {
		return new URL(path, window.location.origin).href;
	} catch {
		return path;
	}
}

function getPathTransition(index: number, duration: number, delay: number) {
	const pathDelay = delay + index * PATH_DELAY_STEP;

	return {
		pathLength: {
			delay: pathDelay,
			duration,
			ease: "easeInOut" as const,
		},
		opacity: {
			delay: pathDelay + OPACITY_DELAY_OFFSET,
			duration: 0.01,
		},
	};
}

async function loadFontFromPaths(fontPaths: string[]): Promise<SignatureFont> {
	for (const path of fontPaths) {
		try {
			const cacheKey = getFontCacheKey(path);
			const cachedFont = fontCache.get(cacheKey);

			if (cachedFont) return cachedFont;

			const response = await fetch(path);
			if (!response.ok) continue;

			const fontBuffer = await response.arrayBuffer();
			const font = parseFont(fontBuffer) as SignatureFont;
			fontCache.set(cacheKey, font);
			return font;
		} catch {
			// Try the next configured font path.
		}
	}

	throw new Error(
		`Font could not be loaded from the provided path${fontPaths.length === 1 ? "" : "s"}: ${fontPaths.join(", ")}`,
	);
}

async function buildSignaturePaths({
	text,
	fontSize,
	baseline,
	horizontalPadding,
}: {
	text: string;
	fontSize: number;
	baseline: number;
	horizontalPadding: number;
}): Promise<{ paths: string[]; viewBox: SignatureViewBox }> {
	const font = await loadFontFromPaths(["/LastoriaBoldRegular.otf"]);
	let x = horizontalPadding;
	const paths: string[] = [];
	let minX = Number.POSITIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const char of text) {
		const glyph = font.charToGlyph(char);
		const path = glyph.getPath(x, baseline, fontSize);
		const bounds = path.getBoundingBox();
		paths.push(path.toPathData(3));
		minX = Math.min(minX, bounds.x1);
		minY = Math.min(minY, bounds.y1);
		maxX = Math.max(maxX, bounds.x2);
		maxY = Math.max(maxY, bounds.y2);
		x += (glyph.advanceWidth ?? font.unitsPerEm) * (fontSize / font.unitsPerEm);
	}
	if (paths.length === 0) {
		return { paths, viewBox: getFallbackViewBox(text, fontSize) };
	}

	const padding = fontSize * 0.08;
	return {
		paths,
		viewBox: {
			x: minX - padding,
			y: minY - padding,
			width: maxX - minX + padding * 2,
			height: maxY - minY + padding * 2,
		},
	};
}

const PATH_VARIANTS = {
	hidden: { pathLength: 0, opacity: 0 },
	visible: { pathLength: 1, opacity: 1 },
};

function SignaturePaths({
	paths,
	stroke,
	strokeWidth,
	strokeLinecap,
	duration,
	delay,
}: {
	paths: string[];
	stroke: string;
	strokeWidth: number;
	strokeLinecap: "round" | "butt";
	duration: number;
	delay: number;
}) {
	return paths.map((path, index) => (
		<motion.path
			key={path}
			d={path}
			stroke={stroke}
			strokeWidth={strokeWidth}
			fill="none"
			variants={PATH_VARIANTS}
			transition={getPathTransition(index, duration, delay)}
			vectorEffect="non-scaling-stroke"
			strokeLinecap={strokeLinecap}
			strokeLinejoin="round"
		/>
	));
}

type SignatureProps = {
	text?: string;
	color?: string;
	fontSize?: number;
	duration?: number;
	delay?: number;
	className?: string;
	inView?: boolean;
	once?: boolean;
};

export function Signature({
	text = "Signature",
	color = "#000",
	fontSize = 14,
	duration = 1.5,
	delay = 0,
	className,
	inView = false,
	once = true,
}: SignatureProps) {
	const [paths, setPaths] = useState<string[]>([]);
	const [viewBox, setViewBox] = useState(() =>
		getFallbackViewBox(text, fontSize),
	);
	const horizontalPadding = fontSize * 0.1;
	const baseline = fontSize;
	const maskId = `signature-reveal-${useId().replace(/:/g, "")}`;

	useEffect(() => {
		let cancelled = false;

		async function loadSignaturePaths() {
			try {
				const next = await buildSignaturePaths({
					text,
					fontSize,
					baseline,
					horizontalPadding,
				});
				if (cancelled) return;
				setPaths(next.paths);
				setViewBox(next.viewBox);
			} catch {
				if (cancelled) return;
				setPaths([]);
				setViewBox(getFallbackViewBox(text, fontSize));
			}
		}

		void loadSignaturePaths();
		return () => {
			cancelled = true;
		};
	}, [text, fontSize, baseline, horizontalPadding]);

	return (
		<motion.svg
			key={paths.length}
			width={viewBox.width}
			height={viewBox.height}
			viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
			fill="none"
			className={className}
			initial="hidden"
			whileInView={inView ? "visible" : undefined}
			animate={inView ? undefined : "visible"}
			viewport={{ once }}
			role="img"
			aria-label={text}
		>
			<defs>
				<mask id={maskId} maskUnits="userSpaceOnUse">
					<SignaturePaths
						paths={paths}
						stroke="white"
						strokeWidth={fontSize * 0.22}
						strokeLinecap="round"
						duration={duration}
						delay={delay}
					/>
				</mask>
			</defs>

			<SignaturePaths
				paths={paths}
				stroke={color}
				strokeWidth={2}
				strokeLinecap="butt"
				duration={duration}
				delay={delay}
			/>

			<g mask={`url(#${maskId})`}>
				{paths.map((path) => (
					<path key={path} d={path} fill={color} />
				))}
			</g>
		</motion.svg>
	);
}
