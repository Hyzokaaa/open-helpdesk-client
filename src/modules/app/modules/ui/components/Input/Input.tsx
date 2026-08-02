import { useMemo, useState } from "react";
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
  required?: boolean;
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
  required,
}: Props) {
  const CLASS = useMemo(
    () => inputClass({ size, full, disabled }),
    [size, full, disabled],
  );

  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={isPassword ? "relative" : undefined}>
      <input
        autoFocus={autoFocus}
        className={CLASS}
        type={isPassword && visible ? "text" : type}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {isPassword && value && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle hover:text-body cursor-pointer transition-colors"
        >
          {visible ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
