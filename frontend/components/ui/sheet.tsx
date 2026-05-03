import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn("fixed inset-0 z-50 bg-black/30", className)}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

type SheetSide = "right" | "left" | "top" | "bottom";

// Position-only presets. Width is applied separately so consumers can
// override with their own w-* class without fighting tailwind-merge over
// arbitrary values.
const SHEET_SIDE_CLASSES: Record<SheetSide, string> = {
  right:
    "inset-y-0 right-0 max-w-full border-l border-[var(--border)]",
  left:
    "inset-y-0 left-0 max-w-full border-r border-[var(--border)]",
  top:
    "inset-x-0 top-0 max-h-full border-b border-[var(--border)]",
  bottom:
    "inset-x-0 bottom-0 max-h-full border-t border-[var(--border)]",
};

const SHEET_DEFAULT_WIDTH: Record<SheetSide, string> = {
  right: "w-[260px]",
  left: "w-[260px]",
  top: "w-full",
  bottom: "w-full",
};

type SheetContentProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
  side?: SheetSide;
};

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ className, side = "right", ...props }, ref) => {
  const userClass = className ?? "";
  const hasWidth = /(?:^|\s)(?:w-|max-w-)/.test(userClass);
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 overflow-y-auto bg-[var(--paper)] p-6 shadow-sm",
          SHEET_SIDE_CLASSES[side],
          hasWidth ? "" : SHEET_DEFAULT_WIDTH[side],
          className
        )}
        {...props}
      />
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left", className)}
      {...props}
    />
  );
}

function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      className={cn("text-lg font-semibold leading-none tracking-tight text-[var(--foreground)]", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      className={cn("text-sm text-[var(--muted-soft)]", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
