import Image, { type ImageProps } from "next/image";

type LogoProps = Omit<ImageProps, "src" | "width" | "height" | "alt"> & {
	alt?: string;
};

export function Logo({ alt = "Logo", className, ...props }: LogoProps) {
	return (
		<Image
			src="/logo.svg"
			alt={alt}
			width={55}
			height={40}
			className={className ? `h-5 w-auto ${className}` : "h-5 w-auto"}
			{...props}
		/>
	);
}
