import { Component } from "solid-js";
import Icon from "./Icon";

interface HeaderProps {
  onThemeToggle: () => void;
}

const Header: Component<HeaderProps> = (props) => {
  return (
    <header class="header" role="banner">
      <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
        <Icon name="logo" size={24} />
        <h1>Fossiq</h1>
      </div>
      <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
        <button
          onClick={props.onThemeToggle}
          title="Toggle theme"
          class="secondary"
          style={{ padding: "0.5rem" }}
        >
          <Icon name="theme" size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
