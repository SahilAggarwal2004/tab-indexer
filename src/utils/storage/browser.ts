export async function setItem(key: string, value: any, local = true) {
  const storage = local ? chrome.storage.local : chrome.storage.session;
  return new Promise<void>((resolve) => storage.set({ [key]: value }, resolve));
}

export async function getItem<T = any>(key: string, fallbackValue?: T, local = true): Promise<T> {
  const storage = local ? chrome.storage.local : chrome.storage.session;
  return new Promise<T>((resolve) => storage.get(key, (result) => resolve(result[key] ?? fallbackValue)));
}

export async function removeItem(key: string, local = true) {
  const storage = local ? chrome.storage.local : chrome.storage.session;
  return new Promise<void>((resolve) => storage.remove(key, resolve));
}
