import { Component, onMount, createEffect } from "solid-js";
import { basicSetup } from "codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { Compartment } from "@codemirror/state";
import { autocompletion } from "@codemirror/autocomplete";
import { linter } from "@codemirror/lint";
import { kql } from "@fossiq/kql-lezer";
import { useTheme } from "../hooks/useTheme";
import { useSchema } from "../contexts/SchemaContext";
import { kqlLightTheme, kqlDarkTheme } from "../styles/editorTheme";
import { createKqlCompletion } from "../utils/completion";
import { createKqlLinter } from "../utils/linter";

interface EditorProps {
  onRun?: () => void;
  onChange?: (value: string) => void;
  initialValue?: string;
}

const Editor: Component<EditorProps> = (props) => {
  let editorContainer: HTMLDivElement | undefined;
  const { theme } = useTheme();
  const { tables } = useSchema();
  const themeCompartment = new Compartment();
  const completionCompartment = new Compartment();
  const linterCompartment = new Compartment();

  onMount(() => {
    if (!editorContainer) return;

    const runCommand = () => {
      if (props.onRun) {
        props.onRun();
        return true;
      }
      return false;
    };

    const view = new EditorView({
      doc: props.initialValue || "Events | take 10",
      extensions: [
        basicSetup,
        kql(),
        linterCompartment.of(linter(createKqlLinter(tables()))),
        themeCompartment.of(theme() === "dark" ? kqlDarkTheme : kqlLightTheme),
        completionCompartment.of(
          autocompletion({ override: [createKqlCompletion(tables())] })
        ),
        keymap.of([
          { key: "Mod-Enter", run: runCommand },
          { key: "Shift-Enter", run: runCommand },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && props.onChange) {
            props.onChange(update.state.doc.toString());
          }
        }),
      ],
      parent: editorContainer,
    });

    createEffect(() => {
      view.dispatch({
        effects: themeCompartment.reconfigure(
          theme() === "dark" ? kqlDarkTheme : kqlLightTheme
        ),
      });
    });

    createEffect(() => {
      view.dispatch({
        effects: completionCompartment.reconfigure(
          autocompletion({ override: [createKqlCompletion(tables())] })
        ),
      });
    });

    createEffect(() => {
      view.dispatch({
        effects: linterCompartment.reconfigure(
          linter(createKqlLinter(tables()))
        ),
      });
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
