import { SetStateAction } from "react";
import { PartialTabConfig } from "../types";

export const getEditingKey = (config: PartialTabConfig, url?: string) => `editing-${btoa(url || config.url)}-${config.id}`;

export function isSetStateFunction<T>(v: SetStateAction<T>): v is (old: T) => T {
  return typeof v === "function";
}
