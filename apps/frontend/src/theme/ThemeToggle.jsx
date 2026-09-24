import { useEffect, useState } from "react";
import { applyTheme, resolveInitialTheme, saveTheme } from "./theme";

export function ThemeToggle(props) {
  const { changeTheme = () => {} } = props;
  const [theme, setTheme] = useState(resolveInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    saveTheme(nextTheme);
    setTheme(nextTheme);
    changeTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={isDark ? "Canvia al tema clar" : "Canvia al tema fosc"}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      {isDark ? "☀️" : "🌛"}
    </button>
  );
}
