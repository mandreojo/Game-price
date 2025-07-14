import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          // Variant
          variant === "default" && "bg-blue-600 text-white hover:bg-blue-700",
          variant === "outline" && "border border-input bg-white text-gray-900 hover:bg-gray-50",
          variant === "ghost" && "bg-transparent hover:bg-gray-100 text-gray-900",
          variant === "link" && "bg-transparent underline text-blue-600 hover:text-blue-800 px-0",
          // Size
          size === "sm" && "h-8 px-3 text-sm rounded-md",
          size === "md" && "h-10 px-4 text-base rounded-lg",
          size === "lg" && "h-12 px-6 text-lg rounded-xl",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button"; 