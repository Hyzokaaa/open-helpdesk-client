import { useId } from "react";
import { FormInputContext } from "@modules/app/modules/ui/components/FormInput/form-input-context";

interface Props {
  label: string;
  control?: boolean;
  children: React.ReactNode;
}

export default function PropertyRow({ label, control, children }: Props) {
  const id = useId();

  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 py-1.5">
      {control ? (
        <label htmlFor={id} className="text-xs text-subtle font-body-medium">
          {label}
        </label>
      ) : (
        <span className="text-xs text-subtle font-body-medium">{label}</span>
      )}
      <div className="min-w-0 text-xs">
        {control ? (
          <FormInputContext.Provider value={id}>{children}</FormInputContext.Provider>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
