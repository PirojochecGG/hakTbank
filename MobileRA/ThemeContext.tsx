import { createContext, useState, ReactNode } from "react";

export const ThemeContext = createContext<{
  isDark: boolean;
  setIsDark: (value: boolean) => void;
}>({
  isDark: true,
  setIsDark: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
