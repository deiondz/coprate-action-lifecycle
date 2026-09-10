import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type MaxWidthContainerProps = ComponentProps<"div"> & {
	size?: "default" | "narrow";
};

const maxWidthBySize: Record<
	NonNullable<MaxWidthContainerProps["size"]>,
	string
> = {
	default: "max-w-7xl",
	narrow: "max-w-3xl",
};

export function MaxWidthContainer({
	className,
	size = "default",
	...props
}: MaxWidthContainerProps) {
	return (
		<div
			className={cn(
				"mx-auto w-full px-4 py-4 md:px-6",
				maxWidthBySize[size],
				className,
			)}
			{...props}
		/>
	);
}
