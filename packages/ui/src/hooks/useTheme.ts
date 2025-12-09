import { createSignal, onMount } from "solid-js";

export function useTheme() {
  const [theme, setTheme] = createSignal<"light" | "dark">("light");

  onMount(() => {
    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
    } else {
      setTheme("light");
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  });

  const toggleTheme = () => {
    setTheme(theme() === "light" ? "dark" : "light");
  };

  return { theme, toggleTheme };
}
