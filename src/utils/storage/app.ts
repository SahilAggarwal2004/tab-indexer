import { storageKey } from "../../constants";
import { ConfigStorage, PartialTabConfig, StorageListener, TabConfig } from "../../types";
import { getItem, setItem } from "./browser";

let storage: ConfigStorage;
let storageChangeListeners: Array<StorageListener> = [];

const storageChangeListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
  if (changes[storageKey]) updateStorage(changes[storageKey].newValue as ConfigStorage, false);
};

export async function getStorage() {
  if (!storage) storage = await getItem(storageKey, { configs: [], isEnabled: true });
  return storage;
}

export function registerStorageChangeListener(listener: StorageListener) {
  storageChangeListeners.push(listener);
}

export function revokeStorageChangeListeners() {
  storageChangeListeners = [];
  chrome.storage.local.onChanged.removeListener(storageChangeListener);
}

async function updateStorage(newStorage: ConfigStorage, persist = true) {
  if (persist) await setItem<ConfigStorage>(storageKey, newStorage);
  storage = newStorage;
  storageChangeListeners.forEach((listener) => listener(newStorage));
}

export async function upsertConfig(config: PartialTabConfig) {
  const timestamp = Date.now();
  const existingIndex = storage.configs.findIndex(({ id }) => id === config.id);
  if (existingIndex === -1) storage.configs.push({ ...config, created: timestamp, updated: timestamp });
  else storage.configs[existingIndex] = { ...(config as TabConfig), updated: timestamp };
  await updateStorage(storage);
}

export async function deleteConfig(config: TabConfig) {
  storage.configs = storage.configs.filter(({ id }) => id !== config.id);
  await updateStorage(storage);
}

export async function setEnabled(enabled: boolean) {
  storage.isEnabled = enabled;
  await updateStorage(storage);
}

export function findMatchingConfig(configs: TabConfig[], currentUrl: string) {
  if (!currentUrl) return null;
  const matchingConfigs = configs.filter((config) => currentUrl.startsWith(config.url));
  if (!matchingConfigs.length) return null;
  return matchingConfigs.reduce((prev, current) => (current.url.length > prev.url.length ? current : prev));
}

chrome.storage.local.onChanged.addListener(storageChangeListener);
getStorage();
