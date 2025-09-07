import { tabIndexSelector } from "../constants";

const originalTabIndices = new Map<Element, string | null>();

export function applyConfig(selectors: string[]): boolean {
  resetTabIndices();
  resetPageTabIndices();

  let appliedCount = 0;
  selectors.forEach((selector, index) => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (originalTabIndices.has(element)) return;
        originalTabIndices.set(element, element.getAttribute("tabindex"));
        element.setAttribute("tabindex", `${index + 1}`);
        appliedCount++;
      });
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error);
    }
  });

  console.log(`Tab Indexer: Applied configuration to ${appliedCount} elements`);
  return appliedCount > 0;
}

function resetPageTabIndices(): void {
  try {
    const elements = document.querySelectorAll(tabIndexSelector);
    elements.forEach((element) => {
      originalTabIndices.set(element, element.getAttribute("tabindex"));
      element.setAttribute("tabindex", "0");
    });
  } catch (error) {
    console.error("Tab Indexer: Error resetting existing tabindex elements", error);
  }
}

export function resetTabIndices(): void {
  originalTabIndices.forEach((index, element) => {
    if (index) element.setAttribute("tabindex", index);
    else element.removeAttribute("tabindex");
  });
  originalTabIndices.clear();
  console.log("Tab Indexer: Reset tab indices");
}
