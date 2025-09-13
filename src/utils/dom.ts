import { memoize } from "utility-kit";
import {
  excludedAttributes,
  excludedClasses,
  focusableSelector,
  frameworkPrefixRegex,
  hashRegex,
  highlightClass,
  overlayClass,
  splitRegex,
  statePrefixRegex,
  stateTokens,
  transitionRegex,
  uniqueAttributes,
} from "../constants";

let overlay: HTMLElement | null = null;
let highlightStyle: HTMLStyleElement | null = null;

export const clearHighlights = () => document.querySelectorAll(`.${highlightClass}`).forEach((el) => el.classList.remove(highlightClass));

export function createOverlay() {
  removeOverlay();
  if (overlay) document.body.appendChild(overlay);
}

const isUnstableClass = memoize((cls: string): boolean => {
  if (!cls) return false;

  // Priority 1: State-related prefixes
  if (statePrefixRegex.test(cls)) return true;

  // Priority 2: Framework/hydration prefixes
  if (frameworkPrefixRegex.test(cls)) return true;

  // Priority 3: Transition/animation related classes
  if (transitionRegex.test(cls)) return true;

  // Priority 4: Hashed/numeric-like sequences
  if (hashRegex.test(cls)) return true;

  // Priority 5: Tokenized state keywords
  const tokens = cls
    .split(splitRegex)
    .filter(Boolean)
    .map((t) => t.toLowerCase());
  if (tokens.some((t) => stateTokens.has(t))) return true;

  // Default: treat as stable
  return false;
});

// Get element classes excluding known unstable classes
const getCleanClasses = (el: HTMLElement) => Array.from(el.classList).filter((cls) => !excludedClasses.has(cls) && !isUnstableClass(cls));

export function generateSelector(element: HTMLElement): string | null {
  if (!element) return null;

  // Priority 1: ID selector
  if (element.id) return `#${CSS.escape(element.id)}`;

  // Priority 2: Unique class combination
  const cleanClasses = getCleanClasses(element);
  if (cleanClasses.length) {
    const classSelector = `.${cleanClasses.map((cls) => CSS.escape(cls)).join(".")}`;
    if (document.querySelectorAll(classSelector).length === 1) return classSelector;
  }

  // Priority 3: Stable attribute-based selectors
  for (const attr of uniqueAttributes) {
    const value = element.getAttribute(attr);
    if (value) {
      const attrSelector = `[${attr}="${CSS.escape(value)}"]`;
      if (document.querySelectorAll(attrSelector).length === 1) return attrSelector;
    }
  }

  // Priority 4: Tag + short unique text content (buttons, links)
  if (element.textContent?.length < 50) {
    const text = element.textContent.trim();
    const tagName = element.tagName.toLowerCase();
    const matchingElements = Array.from(document.querySelectorAll(tagName)).filter(({ textContent }) => textContent?.trim() === text);

    if (matchingElements.length === 1) {
      const siblings = Array.from(element.parentElement?.children || []).filter((el) => el.tagName === element.tagName);
      const index = siblings.indexOf(element) + 1;
      const nthSelector = `${tagName}:nth-of-type(${index})`;
      if (document.querySelectorAll(nthSelector).length === 1) return nthSelector;
    }
  }

  // Priority 5: Structural path (classes or nth-child)
  const path: string[] = [];
  let current: Element | null = element;
  let depth = 0;
  const maxDepth = 6;

  while (current && current !== document.body && depth < maxDepth) {
    const parent: HTMLElement | null = current.parentElement;
    const tagName = current.tagName.toLowerCase();

    if (parent) {
      const currentCleanClasses = getCleanClasses(current as HTMLElement);

      // Use unique class combination at this level
      if (currentCleanClasses.length) {
        const classSelector = `${tagName}.${currentCleanClasses.map((cls) => CSS.escape(cls)).join(".")}`;
        const matchingAtLevel = parent.querySelectorAll(`:scope > ${classSelector}`);
        if (matchingAtLevel.length === 1) {
          path.unshift(classSelector);
          current = parent;
          depth++;
          continue;
        }
      }

      // Fallback to nth-child
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(current) + 1;
      path.unshift(`${tagName}:nth-child(${index})`);
    }

    current = parent;
    depth++;
  }

  if (path.length) {
    const structuralSelector = path.join(" > ");
    if (document.querySelectorAll(structuralSelector).length === 1) return structuralSelector;
  }

  // Priority 6: Last resort - any remaining unique attribute
  const tagName = element.tagName.toLowerCase();
  const allAttributes = Array.from(element.attributes);

  for (const attr of allAttributes) {
    if (!excludedAttributes.has(attr.name) && attr.value) {
      const attrSelector = `${tagName}[${attr.name}="${CSS.escape(attr.value)}"]`;
      if (document.querySelectorAll(attrSelector).length === 1) return attrSelector;
    }
  }

  return null;
}

export function getTargetElement(event: MouseEvent) {
  const element = event.target as HTMLElement;

  // Skip if clicking on our overlay or an element inside it
  if (element === overlay || element.closest(`.${overlayClass}`)) return null;

  return element;
}

export const hasFocusable = (element: Element) => element.matches(focusableSelector) || !!element.querySelector(focusableSelector);

export const highlightElement = (element: HTMLElement) => element.classList.add(highlightClass);

export function initDOM() {
  overlay = document.createElement("div");
  overlay.className = overlayClass;
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(147, 51, 234, 0.05);
    z-index: 999999;
    pointer-events: none;
    border: 2px dashed rgba(147, 51, 234, 0.3);
    box-sizing: border-box;
  `;

  highlightStyle = document.createElement("style");
  highlightStyle.textContent = `
    .${highlightClass} {
      outline: 2px solid #9333ea !important;
      outline-offset: 2px !important;
      background-color: rgba(147, 51, 234, 0.1) !important;
      box-shadow: 0 0 0 4px rgba(147, 51, 234, 0.2) !important;
    }
  `;
  document.head.appendChild(highlightStyle);
}

export function removeOverlay() {
  overlay?.remove();
  clearHighlights();
}

export function showTemporaryMessage(message: string) {
  const messageElement = document.createElement("div");
  messageElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #059669;
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-family: system-ui, -apple-system, sans-serif;
    z-index: 9999999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 300px;
    word-wrap: break-word;
  `;
  messageElement.textContent = message;

  document.body.appendChild(messageElement);

  setTimeout(() => messageElement.parentNode && messageElement.remove(), 3000);
}
