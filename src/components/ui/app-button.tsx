import type { ButtonHTMLAttributes } from "react";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const buttonStyles = {
  primary:
    "border-transparent bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-emerald-700",
  secondary:
    "border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-100 focus-visible:outline-zinc-700",
  ghost:
    "border-transparent bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:outline-zinc-700",
};

export function AppButton({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      className={[
        "inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        buttonStyles[variant],
        className,
      ].join(" ")}
      type={type}
      {...props}
    />
  );
}
