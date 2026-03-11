import { Component, createSignal, JSX, createEffect } from "solid-js";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useTheme } from "../hooks/useTheme";
import styles from "./Layout.module.css";

const STORAGE_KEY_SIDEBAR = "fossiq-sidebar-collapsed";

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

  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(
    localStorage.getItem(STORAGE_KEY_SIDEBAR) === "true"
  );

  const [resultsHeight, setResultsHeight] = createSignal(300);
  const [isResizing, setIsResizing] = createSignal(false);

  createEffect(() => {
    localStorage.setItem(STORAGE_KEY_SIDEBAR, String(sidebarCollapsed()));
  });

  const handleAddSource = () => {
    console.log("Add source clicked");
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
    <div class={styles.container} data-theme={theme()}>
      <Header onThemeToggle={toggleTheme}>{props.headerContent}</Header>
      <div class={styles.content}>
        <div class={styles.mainArea}>
          <div class={styles.topSection}>
            <Sidebar
              onAddSource={handleAddSource}
              collapsed={sidebarCollapsed()}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed())}
            />
            {props.editorPane}
          </div>
        </div>
        <div
          class={styles.resizeHandle}
          onMouseDown={handleMouseDown}
          classList={{ [styles.resizing]: isResizing() }}
        />
        <div
          class={styles.resultsArea}
          style={{ height: `${resultsHeight()}px` }}
        >
          {props.resultsPane}
        </div>
      </div>
    </div>
  );
};

export default Layout;
