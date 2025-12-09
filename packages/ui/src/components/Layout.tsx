import { Component } from "solid-js";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useTheme } from "../hooks/useTheme";

interface LayoutProps {
  children?: any;
}

const Layout: Component<LayoutProps> = (props) => {
  const { theme, toggleTheme } = useTheme();

  const handleAddSource = () => {
    console.log("Add source clicked");
    // TODO: Implement add source dialog
  };

  return (
    <div class="container" data-theme={theme()}>
      <Header onThemeToggle={toggleTheme} />
      <div class="content">
        <Sidebar onAddSource={handleAddSource} />
        {props.children}
      </div>
    </div>
  );
};

export default Layout;
