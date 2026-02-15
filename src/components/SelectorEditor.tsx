/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import ReorderList from "react-reorder-list";
import { PlusIcon, TrashIcon, MousePointerIcon } from "lucide-react";
import { getItem, removeItem, setItem } from "../utils/storage/browser";
import { selectionKey, selectionValidityMinutes, unitDurations } from "../constants";
import { CompletedSelection, SelectorEditorProps, Selectors } from "../types";

export default function SelectorEditor({ editingKey, selectors, updateSelectors }: SelectorEditorProps) {
  const [newSelector, setNewSelector] = useState("");
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addSelector(input?: string) {
    let selector = input || newSelector;
    selector = selector.trim();
    if (!selector) return;
    updateSelectors([...selectors, selector]);
    if (!input) setNewSelector("");
  }

  async function checkForCompletedSelection() {
    try {
      const result = await getItem<CompletedSelection>(selectionKey);
      if (!result) return;

      const { flag, selector, timestamp } = result;
      if (Date.now() - timestamp < selectionValidityMinutes * unitDurations.minute) {
        if (flag) return setIsSelecting(true);
        addSelector(selector);
        await removeItem(selectionKey);
      }
    } catch (error) {
      console.error("Error checking for completed selection:", error);
    }
  }

  const removeSelector = (index: number) => updateSelectors(selectors.filter((_, i) => i !== index));

  async function startElementSelection() {
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error("No active tab found");
      const response = await chrome.tabs.sendMessage(tab.id, { action: "startElementSelection" });
      if (!response.success) throw new Error();
      window.close();
    } catch (error) {
      console.error("Error starting element selection:", error);
      setError((error as Error).message || "Failed to start element selection");
    }
  }

  // Check for completed selection when popup opens
  useEffect(() => {
    getItem(editingKey, undefined, false)
      .then((result) => {
        if (result) updateSelectors(result);
        checkForCompletedSelection();
      })
      .catch((error) => console.error("Error restoring editing state:", error));
  }, [editingKey]);

  // Save editing state whenever selectors change
  useEffect(() => {
    setItem<Selectors>(editingKey, selectors, false).catch((error) => console.error("Error saving editing state:", error));
  }, [selectors, editingKey]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newSelector}
          onChange={(e) => setNewSelector(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSelector()}
          className="flex-1 text-sm border rounded px-2 py-1"
          placeholder="CSS selector (e.g., #my-button)"
          disabled={isSelecting}
        />
        <button
          onClick={startElementSelection}
          disabled={isSelecting}
          className="px-2 py-1 bg-purple-600 text-white rounded text-sm flex items-center gap-1 disabled:opacity-50 hover:bg-purple-700"
          title="Select element from page"
        >
          <MousePointerIcon size={14} />
          {isSelecting ? "Selecting..." : "Select"}
        </button>
        <button
          onClick={() => addSelector()}
          disabled={!newSelector.trim()}
          className="px-2 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 hover:bg-blue-700"
          title="Add selector"
        >
          <PlusIcon size={14} />
        </button>
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</div>}

      {selectors.length !== 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600 font-medium">Tab Order (drag to reorder):</p>
          <ReorderList
            preserveOrder={false}
            animationDuration={200}
            onPositionChange={({ newOrder }) => updateSelectors(newOrder.flatMap((key) => selectors[key as number] || []))}
          >
            {selectors.map((item, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded font-mono">{index + 1}</span>
                <input
                  type="text"
                  value={item}
                  className="flex-1 text-sm border-0 bg-transparent focus:outline-none"
                  onChange={(e) => {
                    const updated = selectors.slice();
                    updated[index] = e.target.value;
                    updateSelectors(updated);
                  }}
                  onBlur={(e) => !e.target.value.trim() && removeSelector(index)}
                />
                <button onClick={() => removeSelector(index)} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Remove">
                  <TrashIcon size={12} />
                </button>
              </div>
            ))}
          </ReorderList>
        </div>
      )}

      {isSelecting && (
        <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded border border-purple-200">
          <p className="font-medium">Element Selection Mode Active</p>
          <p>Click on any element on the webpage to select it. Press ESC to cancel.</p>
        </div>
      )}
    </div>
  );
}
