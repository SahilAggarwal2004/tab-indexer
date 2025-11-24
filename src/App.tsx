import { PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";

import ConfigManager from "./components/ConfigManager";
import useCurrentUrl from "./hooks/useCurrentUrl";
import { TabConfig } from "./types";
import { upsertConfig, findMatchingConfig, setEnabled, registerStorageChangeListener, revokeStorageChangeListeners, getStorage } from "./utils/storage/app";
import { setItem } from "./utils/storage/browser";
import { getEditingKey } from "./utils/functions";

export default function App() {
  const [configs, setConfigs] = useState<TabConfig[]>([]);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [currentUrl, cleanUrl] = useCurrentUrl();

  const activeConfig = findMatchingConfig(configs, currentUrl);

  async function handleCreateConfig() {
    const newConfig = {
      id: Date.now(),
      url: cleanUrl,
      selectors: [],
    };

    await upsertConfig(newConfig);

    try {
      const editingKey = getEditingKey(newConfig);
      await setItem(editingKey, newConfig.selectors, false);
    } catch (error) {
      console.error("Error setting editing state:", error);
    }
  }

  useEffect(() => {
    getStorage().then(({ configs, isEnabled }) => {
      setConfigs(configs);
      setIsEnabled(isEnabled);
    });

    // Register listener for storage changes
    registerStorageChangeListener(({ configs, isEnabled }) => {
      setConfigs(configs.slice());
      setIsEnabled(isEnabled);
    });

    return () => revokeStorageChangeListeners();
  }, []);

  return (
    <div className="w-96 h-[600px] bg-white">
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="logo.webp" alt="Tab Indexer Logo" className="w-8 h-8 object-contain bg-white rounded p-0.5" />
            <h1 className="text-lg font-semibold">Tab Indexer</h1>
          </div>
          <button className={`px-3 py-1 rounded text-sm ${isEnabled ? "bg-green-500" : "bg-red-500"}`} onClick={() => setEnabled(!isEnabled)}>
            {isEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Current URL:</p>
          <p className="text-xs bg-gray-100 p-2 rounded break-all">{currentUrl}</p>
        </div>

        {activeConfig && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-medium text-green-800 mb-1">Active Configuration</p>
            <p className="text-xs text-green-600 break-all">{activeConfig.url}</p>
            <p className="text-xs text-green-600">{activeConfig.selectors.length} selectors</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-medium">Configurations</h2>
          <button
            disabled={!cleanUrl || activeConfig?.url === cleanUrl}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 disabled:opacity-60"
            onClick={handleCreateConfig}
          >
            <PlusIcon size={16} />
            New Config
          </button>
        </div>

        {cleanUrl && (
          <div className="space-y-2 max-h-[225px] overflow-y-scroll">
            {configs.map((config) => (
              <ConfigManager key={config.id} config={config} cleanUrl={cleanUrl} isActive={activeConfig?.url === config.url} />
            ))}
            {configs.length === 0 && <p className="text-gray-500 text-center py-8">No configurations yet</p>}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gray-50 p-3 border-t">
        <div className="text-xs text-gray-600">
          <p>
            <kbd>Ctrl+Shift+A</kbd> Enable/force apply config
          </p>
          <p>
            <kbd>Ctrl+Shift+D</kbd> Disable extension
          </p>
        </div>
      </div>
    </div>
  );
}
