export async function getItem<T = unknown>(key: string, fallbackValue?: T, local = true) {
  const storage = local ? chrome.storage.local : chrome.storage.session;
  return new Promise<T>((resolve) => storage.get(key, (result) => resolve((result[key] ?? fallbackValue) as T)));
}

export async function removeItem(key: string, local = true) {
  const storage = local ? chrome.storage.local : chrome.storage.session;
  return new Promise<void>((resolve) => storage.remove(key, resolve));
}

export async function setItem<T = unknown>(key: string, value: T, local = true) {
  const storage = local ? chrome.storage.local : chrome.storage.session;
  return new Promise<void>((resolve) => storage.set({ [key]: value }, resolve));
}
