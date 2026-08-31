import clsx from "clsx";
import { Size } from "../../domain/size";

interface Props {
  children: React.ReactNode;
  size?: Size;
  required?: boolean;
  htmlFor?: string;
}

export default function Label({ children, size = "sm", required, htmlFor }: Props) {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx("text-secondary-text font-body-medium", {
        "text-sm": size === "sm",
        "text-base": size === "base",
        "text-xs": size === "xs",
      })}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}
