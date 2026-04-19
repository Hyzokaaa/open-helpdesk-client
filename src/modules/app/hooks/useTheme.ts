import { useContext } from "react";
import { ThemeContext } from "../context/theme-context";

export default function useTheme() {
  return useContext(ThemeContext);
}
