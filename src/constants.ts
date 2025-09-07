export const excludedAttributes = ["class", "style"];

export const highlightClass = "tab-indexer-highlight";

export const overlayClass = "tab-indexer-overlay";

export const excludedClasses = [highlightClass, overlayClass];

export const focusableAttributes = ["disabled", "contenteditable", "href", "controls"];

export const tabIndexSelector = "[tabindex]:not([tabindex='-1'])";

const focusableElements = [
  tabIndexSelector,
  "button",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[contenteditable]:not([contenteditable='false'])",
  "iframe",
  "details summary",
  "audio[controls]",
  "video[controls]",
];

export const focusableSelector = focusableElements.join(", ");

export const matchPatterns = ["<all_urls>"];

export const selectionKey = "completed-selection";

export const selectionValidityMinutes = 5;

export const source = "tab-indexer";

export const uniqueAttributes = ["data-testid", "aria-label", "name", "href", "data-id"];

export const unitDurations = { minute: 60 * 1000 };
