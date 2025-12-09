import { Component, onMount } from "solid-js";
import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";

const Editor: Component = () => {
  let editorContainer: HTMLDivElement | undefined;

  onMount(() => {
    if (!editorContainer) return;

    const view = new EditorView({
      doc: "",
      extensions: [basicSetup],
      parent: editorContainer,
    });

    return () => {
      view.destroy();
    };
  });

  return (
    <div ref={editorContainer} style={{ height: "100%", width: "100%" }} />
  );
};

export default Editor;
