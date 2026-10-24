import * as monaco from "monaco-editor/editor/editor.api.js";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import "monaco-editor/languages/definitions/python/register.js";
export function createEditor(
  node: HTMLElement,
  value: string,
  change: (s: string) => void,
) {
  (self as typeof self & { MonacoEnvironment: unknown }).MonacoEnvironment = {
    getWorker: () => new EditorWorker(),
  };
  monaco.editor.defineTheme("ascent", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#f8f7f1",
      "editor.foreground": "#252923",
      "editorLineNumber.foreground": "#68725e",
      "editor.lineHighlightBackground": "#e9ecdf",
    },
  });
  const editor = monaco.editor.create(node, {
    value,
    language: "python",
    theme:
      document.documentElement.dataset.theme === "dark" ? "vs-dark" : "ascent",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 12,
    fontFamily: "Consolas, monospace",
    lineNumbersMinChars: 3,
    padding: { top: 18 },
    scrollBeyondLastLine: false,
    tabSize: 4,
    wordWrap: "on",
  });
  const listener = editor.onDidChangeModelContent(() =>
    change(editor.getValue()),
  );
  const observer = new MutationObserver(() =>
    monaco.editor.setTheme(
      document.documentElement.dataset.theme === "dark" ? "vs-dark" : "ascent",
    ),
  );
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return {
    value: () => editor.getValue(),
    dispose: () => {
      observer.disconnect();
      listener.dispose();
      editor.getModel()?.dispose();
      editor.dispose();
    },
  };
}
