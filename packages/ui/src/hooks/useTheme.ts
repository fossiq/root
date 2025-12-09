import { createSignal, onMount, createEffect } from "solid-js";

const THEME_STORAGE_KEY = "fossiq-theme";

export function useTheme() {
  const [theme, setTheme] = createSignal<"light" | "dark">("light");

  onMount(() => {
    // Check localStorage first for saved preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as
      | "light"
      | "dark"
      | null;

    if (savedTheme) {
      // User has manually set a theme - use it and ignore system preference
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // No saved preference - use system preference
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        setTheme("dark");
        applyTheme("dark");
      } else {
        setTheme("light");
        applyTheme("light");
      }
    }
  });

  // Watch for theme changes and apply them to DOM
  createEffect(() => {
    applyTheme(theme());
  });

  const toggleTheme = () => {
    const newTheme = theme() === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (selectedTheme: "light" | "dark") => {
    // Update document class for CSS to respond to
    document.documentElement.classList.remove("theme-light", "theme-dark");
    document.documentElement.classList.add(`theme-${selectedTheme}`);

    // Also set data attribute as fallback
    document.documentElement.setAttribute("data-theme", selectedTheme);
  };

  return { theme, toggleTheme };
}
