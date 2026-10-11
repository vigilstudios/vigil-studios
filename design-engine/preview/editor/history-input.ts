/** Native text undo stays inside fields; document shortcuts apply elsewhere. */
export function historyShortcut(event: { key: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }, editable: boolean): "undo" | "redo" | undefined {
  if (editable || event.altKey || !event.metaKey && !event.ctrlKey) return;
  const key = event.key.toLowerCase();
  if (key === "z") return event.shiftKey ? "redo" : "undo";
  if (key === "y" && event.ctrlKey && !event.metaKey && !event.shiftKey) return "redo";
}
