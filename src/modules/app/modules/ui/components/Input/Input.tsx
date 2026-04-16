import { useMemo } from "react";
import { Size } from "../../domain/size";
import { inputClass } from "../../shared/domain/input-class";

interface Props {
  value?: string;
  onChange?: (v: string) => void;
  size?: Size;
  placeholder?: string;
  name?: string;
  type?: "text" | "password" | "email";
  full?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function Input({
  placeholder,
  size = "sm",
  value,
  onChange,
  type = "text",
  name,
  full = true,
  disabled,
  autoFocus,
}: Props) {
  const CLASS = useMemo(
    () => inputClass({ size, full, disabled }),
    [size, full, disabled],
  );

  return (
    <input
      autoFocus={autoFocus}
      className={CLASS}
      type={type}
      name={name}
      placeholder={placeholder}
      disabled={disabled}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
