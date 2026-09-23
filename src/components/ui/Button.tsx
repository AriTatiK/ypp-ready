import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "accent" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-navy-900 text-paper hover:bg-navy-800",
  secondary: "border border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-paper",
  accent: "bg-terracotta-600 text-paper hover:bg-terracotta-500",
  ghost: "text-navy-900 hover:bg-paper-alt",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm sm:text-base",
  lg: "px-6 py-3.5 text-base sm:text-lg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = CommonProps & {
  href: string;
  prefetch?: boolean;
};

export default function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", className = "", children } = props;
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className} min-h-11`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes} prefetch={props.prefetch}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, href: _h, ...rest } = props as ButtonProps;
  void _v;
  void _s;
  void _c;
  void _h;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
