import clsx from "clsx";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export const Button = (props: ComponentProps<"button">) => (
  <button
    {...props}
    className={twMerge(
      clsx(
        "bg-slate-600 px-8 py-4 rounded-md text-xl font-bold hover:opacity-80 transition-opacity disabled:pointer-events-none disabled:opacity-50",
        props.className,
      ),
    )}
  />
);
