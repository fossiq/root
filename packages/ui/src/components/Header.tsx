import { Component } from "solid-js";
import Icon from "./Icon";

const Header: Component = () => {
  return (
    <header class="header" role="banner">
      <div style={{ display: "flex", "align-items": "center", gap: "0.75rem" }}>
        <Icon name="logo" size={24} />
        <h1>Fossiq</h1>
      </div>
      <div class="pane-actions">
        <button title="Run query (Ctrl+Shift+Enter)">▶ Run</button>
        <button class="secondary" title="Clear results">
          ✕ Clear
        </button>
      </div>
    </header>
  );
};

export default Header;
