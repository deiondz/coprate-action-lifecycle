"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import type React from "react";
import { cn } from "@/lib/utils";

export function Field({
  className,
  orientation = "vertical",
  ...props
}: FieldPrimitive.Root.Props & {
  orientation?: "horizontal" | "vertical";
}): React.ReactElement {
  return (
    <FieldPrimitive.Root
      className={cn(
        "flex gap-2",
        orientation === "vertical" && "flex-col items-start",
        orientation === "horizontal" && "items-start",
        className,
      )}
      data-slot="field"
      {...props}
    />
  );
}

export function FieldLabel({
  className,
  ...props
}: React.ComponentProps<"label">): React.ReactElement {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 font-medium text-base/4.5 text-foreground data-disabled:opacity-64 sm:text-sm/4",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

export function FieldItem({
  className,
  ...props
}: FieldPrimitive.Item.Props): React.ReactElement {
  return (
    <FieldPrimitive.Item
      className={cn("flex", className)}
      data-slot="field-item"
      {...props}
    />
  );
}

export function FieldContent({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("flex flex-1 flex-col gap-1.5", className)}
      data-slot="field-content"
      {...props}
    />
  );
}

export function FieldTitle({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("flex items-center gap-2 font-medium text-sm", className)}
      data-slot="field-title"
      {...props}
    />
  );
}

export function FieldGroup({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("grid gap-4", className)}
      data-slot="field-group"
      {...props}
    />
  );
}

export function FieldSeparator({
  className,
  children,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn("relative my-2 flex items-center gap-3", className)}
      data-slot="field-separator"
      {...props}
    >
      <div className="h-px flex-1 bg-border" />
      {children && (
        <span
          className="shrink-0 bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">): React.ReactElement {
  return (
    <p
      className={cn("text-muted-foreground text-xs", className)}
      data-slot="field-description"
      {...props}
    />
  );
}

export function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}): React.ReactElement | null {
  const content =
    children ??
    errors
      ?.map((error) => error?.message)
      .filter((message): message is string => Boolean(message))
      .join(", ");

  if (!content) return null;

  return (
    <div
      className={cn("text-destructive-foreground text-xs", className)}
      data-slot="field-error"
      role="alert"
      {...props}
    >
      {content}
    </div>
  );
}

export const FieldControl: typeof FieldPrimitive.Control =
  FieldPrimitive.Control;
export const FieldValidity: typeof FieldPrimitive.Validity =
  FieldPrimitive.Validity;

export { FieldPrimitive };
