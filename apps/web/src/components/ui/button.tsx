import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-body active:scale-[0.98] hover:shadow-soft",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-none",
        link: "text-primary underline-offset-4 hover:underline hover:shadow-none",
        // Premium variants for the pet clothing brand
        hero: "bg-foreground text-background hover:bg-foreground/90 hover:translate-y-[-2px] hover:shadow-elevated uppercase tracking-[0.2em] text-xs font-semibold h-14 px-10",
        "hero-outline": "border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background hover:translate-y-[-2px] hover:shadow-elevated uppercase tracking-[0.2em] text-xs font-semibold h-14 px-10",
        elegant: "bg-charcoal text-primary-foreground hover:bg-charcoal/90 hover:translate-y-[-2px] tracking-wider",
        minimal: "bg-transparent text-foreground hover:bg-muted underline-offset-4 tracking-wide hover:shadow-none",
        premium: "bg-foreground text-background hover:bg-foreground/80 hover:translate-y-[-2px] hover:shadow-elevated uppercase tracking-[0.15em] text-xs font-medium",
        "premium-outline": "border border-foreground/30 bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background hover:translate-y-[-2px] hover:shadow-elevated uppercase tracking-[0.15em] text-xs font-medium",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
