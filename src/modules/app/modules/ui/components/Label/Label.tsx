import clsx from "clsx";
import { Size } from "../../domain/size";

interface Props {
  children: React.ReactNode;
  size?: Size;
  required?: boolean;
}

export default function Label({ children, size = "sm", required }: Props) {
  return (
    <label
      className={clsx("text-gray-600 dark:text-gray-300 font-body-medium", {
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
