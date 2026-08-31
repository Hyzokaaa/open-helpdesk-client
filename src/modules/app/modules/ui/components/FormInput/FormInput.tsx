import { useId } from "react";
import clsx from "clsx";
import Label from "../Label/Label";
import { Size } from "../../domain/size";
import { FormInputContext } from "./form-input-context";

interface Props {
  label?: string;
  required?: boolean;
  className?: string;
  size?: Size;
  children?: React.ReactNode;
}

export default function FormInput({
  children,
  label,
  required,
  className,
  size = "sm",
}: Props) {
  const id = useId();

  return (
    <section className={clsx("w-full flex flex-col mb-4", className)}>
      {label && (
        <div className="flex w-full items-center mb-1.5">
          <Label size={size} required={required} htmlFor={id}>
            {label}
          </Label>
        </div>
      )}
      <FormInputContext.Provider value={id}>
        {children}
      </FormInputContext.Provider>
    </section>
  );
}
