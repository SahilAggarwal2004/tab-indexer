import { source } from "../../constants";
import { ConfigStorage, PartialTabConfig, TabConfig } from "../../types";
import { getItem, setItem } from "./browser";

let storage: ConfigStorage;
let storageChangeListeners: Array<(value: any) => any> = [];

const storageChangeListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
  if (changes[source]) updateStorage(changes[source].newValue, false);
};

export async function getStorage() {
  if (storage) return storage;
  return new Promise<ConfigStorage>(async (resolve) => {
    storage = await getItem(source, { configs: [], isEnabled: true });
    resolve(storage);
  });
}

export function registerStorageChangeListener(listener: (storage: ConfigStorage) => any) {
  storageChangeListeners.push(listener);
}

export function revokeStorageChangeListeners() {
  storageChangeListeners = [];
  chrome.storage.local.onChanged.removeListener(storageChangeListener);
}

async function updateStorage(newStorage: ConfigStorage, persist = true) {
  if (persist) await setItem(source, newStorage);
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
