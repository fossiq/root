import { Component } from "solid-js";
import Icon from "./Icon";
import styles from "./Header.module.css";

interface HeaderProps {
  onThemeToggle: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
}

const Header: Component<HeaderProps> = (props) => {
  return (
    <header class={styles.header} role="banner">
      <div class={styles.titlebarContent}>
        <div
          style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}
        >
          <Icon name="logo" size={24} />
          <h1 class={styles.title}>Fossiq</h1>
        </div>
        <div
          style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}
        >
          {props.children}
          <div
            style={{
              width: "1px",
              height: "1.5rem",
              background: "var(--border-color)",
              margin: "0 0.25rem",
            }}
          />
          <button
            onClick={props.onThemeToggle}
            title="Toggle theme"
            class={`secondary ${styles.themeToggleBtn}`}
            style={{ padding: "0.5rem" }}
          >
            <Icon name="theme" size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
