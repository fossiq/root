import { Component, Show } from "solid-js";
import { icons } from "../icons";

interface IconProps {
  name: string;
  size?: number | string;
  class?: string;
  title?: string;
}

/**
 * Icon Component
 *
 * Renders an icon from the icons registry.
 *
 * @example
 * <Icon name="plus-circle" size={24} />
 * <Icon name="plus-circle" size="2rem" class="my-icon" />
 *
 * To add a new icon:
 * 1. Add it to src/icons/index.ts with viewBox and path
 * 2. Use <Icon name="{name}" /> in your components
 */
const Icon: Component<IconProps> = (props) => {
  const size = () => {
    const s = props.size || 24;
    return typeof s === "number" ? `${s}px` : s;
  };

  return (
    <Show
      when={icons[props.name]}
      fallback={<span title={`Icon "${props.name}" not found`}>❌</span>}
    >
      {(icon) => (
        <svg
          class={`icon icon-${props.name} ${props.class || ""}`}
          style={{
            width: size(),
            height: size(),
            "min-width": size(),
            "min-height": size(),
          }}
          aria-hidden={!props.title}
          role={props.title ? "img" : undefined}
          viewBox={icon().viewBox}
          xmlns="http://www.w3.org/2000/svg"
        >
          <g innerHTML={icon().path} />
        </svg>
      )}
    </Show>
  );
};

export default Icon;
