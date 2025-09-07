type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// components/ConfigManager.tsx
export type ConfigManagerProps = {
  cleanUrl: string;
  config: TabConfig;
  isActive: boolean;
};

// components/SelectorEditor.tsx
export type SelectorEditorProps = {
  editingKey: string;
  selectors: string[];
  updateSelectors: (selectors: string[]) => void;
};

// utils/storage/app.ts
export type ConfigStorage = {
  configs: TabConfig[];
  isEnabled: boolean;
};

// utils/functions.ts
export type PartialTabConfig = Optional<TabConfig, "created" | "updated">;

// App.tsx
export type TabConfig = {
  id: number;
  url: string;
  selectors: string[];
  created: number;
  updated: number;
};
