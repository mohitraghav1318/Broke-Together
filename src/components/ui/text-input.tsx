import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextInput({
  className = "",
  id,
  label,
  ...props
}: TextInputProps) {
  return (
    <label
      className="grid gap-2 text-sm font-medium text-zinc-800"
      htmlFor={id}
    >
      {label}
      <input
        className={[
          "h-11 rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100",
          className,
        ].join(" ")}
        id={id}
        {...props}
      />
    </label>
  );
}
