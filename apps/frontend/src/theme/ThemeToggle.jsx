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
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {isDark ? (
          <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 17a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM3 11h1a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2Zm17 0h1a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2ZM5.6 4.2l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 1.4-1.4Zm13.5 13.5.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 1.4-1.4Zm.7-13.5a1 1 0 0 1 0 1.4l-.7.7a1 1 0 1 1-1.4-1.4l.7-.7a1 1 0 0 1 1.4 0ZM6.3 17.7a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.4-1.4l.7-.7a1 1 0 0 1 1.4 0Z" />
        ) : (
          <path d="M20.7 14.3A8.5 8.5 0 0 1 9.7 3.3a.75.75 0 0 0-1-.9A10 10 0 1 0 21.6 15.3a.75.75 0 0 0-.9-1Z" />
        )}
      </svg>
    </button>
  );
}
