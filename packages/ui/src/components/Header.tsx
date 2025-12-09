import { Component, createSignal } from "solid-js";
import Icon from "./Icon";

interface HeaderProps {
  onThemeToggle?: () => void;
}

const Header: Component<HeaderProps> = (props) => {
  const [isDark, setIsDark] = createSignal(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  const handleThemeToggle = () => {
    setIsDark(!isDark());
    props.onThemeToggle?.();
  };

  return (
    <header class="header" role="banner">
      <h1>Fossiq</h1>
      <div style={{ display: "flex", gap: "1rem", "align-items": "center" }}>
        <button
          onClick={handleThemeToggle}
          aria-label="Toggle dark/light theme"
          title="Toggle theme"
          class="theme-toggle"
        >
          <Icon name={isDark() ? "sun" : "moon"} size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
