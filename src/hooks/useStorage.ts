/* eslint-disable react-hooks/exhaustive-deps */
import { SetStateAction, useEffect, useState } from "react";
import { getItem, setItem } from "../utils/storage/browser";
import { isSetStateFunction } from "../utils/functions";

export default function useStorage<T>(key: string, initialValue: T, local = true) {
  const [storedValue, setStoredValue] = useState(initialValue);

  async function setValue(value: SetStateAction<T>) {
    const updatedValue = isSetStateFunction(value) ? value(storedValue) : value;
    try {
      await setItem<T>(key, updatedValue, local);
      setStoredValue(updatedValue);
    } catch (error) {
      console.error(`Error saving value for ${key}:`, error);
    }
  }

  useEffect(() => {
    getItem(key, initialValue, local).then(setStoredValue);
  }, [key, local]);

  return [storedValue, setValue] as const;
}
