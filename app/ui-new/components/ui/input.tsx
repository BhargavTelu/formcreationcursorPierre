import * as React from "react";
import { cn } from "@/app/ui-new/types/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          `
          flex h-14 w-full rounded-xl border
          border-border bg-background px-4 py-3
          text-base placeholder:text-muted-foreground
          transition
          focus-visible:border-amber-600
          focus-visible:ring-4
          focus-visible:ring-amber-600/25
          focus-visible:outline-none
          disabled:cursor-not-allowed disabled:opacity-50
          `,
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
