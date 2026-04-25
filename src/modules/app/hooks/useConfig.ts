import { useContext } from "react";
import { ConfigContext } from "../context/config-context";

export default function useConfig() {
  return useContext(ConfigContext);
}
