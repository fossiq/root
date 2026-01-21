import { Component, createSignal, JSX } from "solid-js";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useTheme } from "../hooks/useTheme";

interface LayoutProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headerContent?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorPane?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resultsPane?: any;
}

const Layout: Component<LayoutProps> = (props) => {
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);
  const [resultsHeight, setResultsHeight] = createSignal(300);
  const [isResizing, setIsResizing] = createSignal(false);

  const handleAddSource = () => {
    console.log("Add source clicked");
    // TODO: Implement add source dialog
  };

  const handleMouseDown: JSX.EventHandler<HTMLDivElement, MouseEvent> = (e) => {
    e.preventDefault();
    setIsResizing(true);

    const startY = e.clientY;
    const startHeight = resultsHeight();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.min(Math.max(startHeight + deltaY, 100), 600);
      setResultsHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div class="container" data-theme={theme()}>
      <Header onThemeToggle={toggleTheme}>{props.headerContent}</Header>
      <div class="content">
        <div class="main-area">
          <div class="top-section">
            <Sidebar
              onAddSource={handleAddSource}
              collapsed={sidebarCollapsed()}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed())}
            />
            {props.editorPane}
          </div>
        </div>
        <div
          class="resize-handle"
          onMouseDown={handleMouseDown}
          classList={{ resizing: isResizing() }}
        />
        <div class="results-area" style={{ height: `${resultsHeight()}px` }}>
          {props.resultsPane}
        </div>
      </div>
    </div>
  );
};

export default Layout;
