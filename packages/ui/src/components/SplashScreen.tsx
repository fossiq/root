import { Component, Show, createEffect, createSignal } from "solid-js";
import { useSchema } from "../contexts/SchemaContext";

// Inline logo SVG adjusted for dark background: outer white, inner accent blue
const Logo: Component = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 192 192"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
    style={{ width: "100%", height: "100%" }}
  >
    <path
      d="M64 64L32 96l32 32M128 64l32 32-32 32M96 48v96"
      stroke="white"
      stroke-width="24"
    />
    <path
      d="M64 64L32 96l32 32M128 64l32 32-32 32M96 48v96"
      stroke="rgba(77,171,247,0.7)"
      stroke-width="12"
    />
  </svg>
);

const SplashScreen: Component = () => {
  const { loading, loadProgress, loadStatus } = useSchema();
  const [gone, setGone] = createSignal(false);

  createEffect(() => {
    if (!loading()) {
      // Brief pause so user sees 100% before fade
      setTimeout(() => setGone(true), 700);
    }
  });

  return (
    <Show when={!gone()}>
      <div
        style={{
          position: "fixed",
          inset: "0",
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
          background: "linear-gradient(160deg, #0a2d4e 0%, #061c30 100%)",
          "z-index": "9999",
          transition: "opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: loading() ? "1" : "0",
          "pointer-events": loading() ? "auto" : "none",
          "user-select": "none",
        }}
      >
        {/* Logo with subtle glow pulse */}
        <div
          style={{
            width: "96px",
            height: "96px",
            "margin-bottom": "1.75rem",
            filter: `drop-shadow(0 0 ${loading() ? "24px" : "8px"} rgba(77,171,247,0.5))`,
            transition: "filter 0.4s ease",
            animation: "fossiq-pulse 2.4s ease-in-out infinite",
          }}
        >
          <Logo />
        </div>

        {/* App name */}
        <h1
          style={{
            color: "white",
            "font-size": "1.75rem",
            "font-weight": "300",
            "letter-spacing": "0.25em",
            "text-transform": "uppercase",
            margin: "0 0 0.35rem 0",
            "font-family": "'Cascadia Code', monospace",
          }}
        >
          Fossiq
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.4)",
            "font-size": "0.8rem",
            "letter-spacing": "0.1em",
            margin: "0 0 3rem 0",
            "text-transform": "uppercase",
          }}
        >
          KQL Query Explorer
        </p>

        {/* Progress bar */}
        <div style={{ width: "260px" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              "border-radius": "999px",
              height: "3px",
              overflow: "hidden",
              "margin-bottom": "0.9rem",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${loadProgress()}%`,
                background:
                  "linear-gradient(90deg, #4dabf7 0%, #74c0fc 50%, #a5d8ff 100%)",
                "border-radius": "999px",
                transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                "box-shadow": "0 0 8px rgba(77,171,247,0.6)",
              }}
            />
          </div>

          {/* Status + percentage */}
          <div
            style={{
              display: "flex",
              "justify-content": "space-between",
              "align-items": "center",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.35)",
                "font-size": "0.7rem",
                "letter-spacing": "0.05em",
                "font-family": "'Cascadia Code', monospace",
              }}
            >
              {loadStatus()}
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.5)",
                "font-size": "0.7rem",
                "font-family": "'Cascadia Code', monospace",
                "min-width": "2.5rem",
                "text-align": "right",
              }}
            >
              {loadProgress()}%
            </span>
          </div>
        </div>

        <style>{`
          @keyframes fossiq-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.85; transform: scale(0.97); }
          }
        `}</style>
      </div>
    </Show>
  );
};

export default SplashScreen;
