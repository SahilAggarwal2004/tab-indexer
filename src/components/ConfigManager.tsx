import { useState, useEffect } from "react";
import { ConfigManagerProps, TabConfig } from "../types";
import SelectorEditor from "./SelectorEditor";
import { EditIcon, TrashIcon, SaveIcon, XIcon } from "lucide-react";
import { getItem, removeItem, setItem } from "../utils/storage/browser";
import { getEditingKey } from "../utils/functions";
import { deleteConfig, upsertConfig } from "../utils/storage/app";

export default function ConfigManager({ cleanUrl, config, isActive }: ConfigManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState<TabConfig>(config);
  const editingKey = getEditingKey(config, cleanUrl);

  const clearEditingStateFlag = () => removeItem(editingKey, false).catch((error) => console.error("Error clearing editing state:", error));

  async function handleSave() {
    try {
      await upsertConfig(editedConfig);
      setIsEditing(false);
      clearEditingStateFlag();
    } catch (error) {
      console.error("Error saving config:", error);
    }
  }

  useEffect(() => {
    getItem(editingKey, undefined, false)
      .then((state) => {
        setIsEditing(state !== undefined);
        if (state) setEditedConfig({ ...config, selectors: state });
      })
      .catch((error) => console.error("Error checking editing state:", error));
  }, [editingKey]);

  useEffect(() => {
    if (isEditing) setItem(editingKey, editedConfig.selectors, false).catch((error) => console.error("Error setting editing state:", error));
  }, [isEditing, editingKey]);

  return (
    <div className={`border rounded p-3 ${isActive ? "border-green-300 bg-green-50" : "border-gray-200"}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editedConfig.url}
              placeholder="URL pattern..."
              className="w-full text-sm border rounded px-2 py-1"
              onChange={(e) => setEditedConfig({ ...editedConfig, url: e.target.value })}
            />
          ) : (
            <div>
              <p className="text-sm font-medium break-all">{config.url}</p>
              <p className="text-xs text-gray-500">
                {config.selectors.length} selector{config.selectors.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-1 ml-2">
          {isEditing ? (
            <>
              <button title="Save" className="p-1 text-green-600 hover:bg-green-100 rounded" onClick={handleSave}>
                <SaveIcon size={16} />
              </button>
              <button
                title="Cancel"
                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => {
                  setIsEditing(false);
                  setEditedConfig(config);
                  clearEditingStateFlag();
                }}
              >
                <XIcon size={16} />
              </button>
            </>
          ) : (
            <>
              <button title="Edit" className="p-1 text-blue-600 hover:bg-blue-100 rounded" onClick={() => setIsEditing(true)}>
                <EditIcon size={16} />
              </button>
              <button
                title="Delete"
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                onClick={() => deleteConfig(config).catch((error) => console.error("Error deleting config:", error))}
              >
                <TrashIcon size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing && <SelectorEditor editingKey={editingKey} selectors={editedConfig.selectors} updateSelectors={(selectors) => setEditedConfig({ ...editedConfig, selectors })} />}
    </div>
  );
}
