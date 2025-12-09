import { Component } from "solid-js";

interface IconProps {
  name: string;
  size?: number | string;
  class?: string;
  title?: string;
}

/**
 * Icon Component
 *
 * Renders an icon from the SVG sprite file.
 *
 * @example
 * <Icon name="moon" size={24} />
 * <Icon name="plus" size="2rem" class="my-icon" />
 *
 * To add a new icon:
 * 1. Add a new <symbol> to public/icons.svg with id="icon-{name}"
 * 2. Use <Icon name="{name}" /> in your components
 */
const Icon: Component<IconProps> = (props) => {
  const size = () => {
    const s = props.size || 24;
    return typeof s === "number" ? `${s}px` : s;
  };

  return (
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
    >
      <use href={`/icons.svg#icon-${props.name}`} />
    </svg>
  );
};

export default Icon;
