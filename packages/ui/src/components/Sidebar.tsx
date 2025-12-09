import { Component } from "solid-js";
import Icon from "./Icon";

interface SidebarProps {
  onAddSource?: () => void;
}

const Sidebar: Component<SidebarProps> = (props) => {
  return (
    <aside class="sidebar" role="navigation" aria-label="Sources panel">
      <button
        onClick={props.onAddSource}
        title="Add data source"
        aria-label="Add data source"
        class="add-source-btn"
      >
        <Icon name="icon-plus-circle" size={22} />
      </button>
    </aside>
  );
};

export default Sidebar;
