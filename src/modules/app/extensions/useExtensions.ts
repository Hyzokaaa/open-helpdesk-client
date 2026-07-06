import { useContext } from "react";
import { ExtensionContext } from "./extension-context";

export default function useExtensions() {
  return useContext(ExtensionContext);
}
