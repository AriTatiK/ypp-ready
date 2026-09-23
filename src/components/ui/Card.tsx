import type { HTMLAttributes, ReactNode } from "react";

export default function Card({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border-subtle bg-white/60 p-5 sm:p-6 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
