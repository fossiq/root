import { Component } from "solid-js";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useTheme } from "../hooks/useTheme";

interface LayoutProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SolidJS children can be any renderable type
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
        {props.children}
        <Sidebar onAddSource={handleAddSource} />
      </div>
    </div>
  );
};

export default Layout;
