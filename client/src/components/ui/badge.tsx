import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  children: ReactNode;
}

const variants = {
  default: "bg-primary text-white",
  secondary: "bg-gray-100 text-gray-800",
  destructive: "bg-danger text-white",
  outline: "border border-gray-300 bg-white text-gray-800",
};

export function Badge({ className, variant = "default", children }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
