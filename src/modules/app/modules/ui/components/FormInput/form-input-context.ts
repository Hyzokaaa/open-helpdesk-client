import { createContext, useContext } from "react";

export const FormInputContext = createContext<string | undefined>(undefined);

export function useFormInputId(): string | undefined {
  return useContext(FormInputContext);
}
