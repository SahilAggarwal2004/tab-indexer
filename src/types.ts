type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// components/ConfigManager.tsx
export type ConfigManagerProps = {
  cleanUrl: string;
  config: TabConfig;
  isActive: boolean;
};

// components/SelectorEditor.tsx
export type CompletedSelection = {
  flag: boolean;
  timestamp: number;
  selector?: string;
};

export type SelectorEditorProps = {
  editingKey: string;
  selectors: Selectors;
  updateSelectors: (selectors: Selectors) => void;
};

export type Selectors = string[];

// utils/storage/app.ts
export type ConfigStorage = {
  configs: TabConfig[];
  isEnabled: boolean;
};

export type StorageListener = (storage: ConfigStorage) => void;

// utils/functions.ts
export type PartialTabConfig = Optional<TabConfig, "created" | "updated">;

// App.tsx
export type TabConfig = {
  id: number;
  url: string;
  selectors: Selectors;
  created: number;
  updated: number;
};

// script.ts
export type Callback<T extends unknown[] = []> = (...args: T) => void;
