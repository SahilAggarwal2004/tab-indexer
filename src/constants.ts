export const excludedAttributes = new Set(["class", "style"]);

export const highlightClass = "tab-indexer-highlight";

export const overlayClass = "tab-indexer-overlay";

export const excludedClasses = new Set([highlightClass, overlayClass]);

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

export const frameworkPrefixRegex = /^(?:ng-|v-|svelte-|sc-|css-|tw-|tailwind-)/i;

export const hashRegex = /(^[a-z]{1,3}-?\d{3,}$)|[a-f0-9]{5,}|[_-][a-z0-9]{5,}$/i;

export const selectionKey = "completed-selection";

export const selectionValidityMinutes = 5;

export const splitRegex = /[^a-z0-9]+/i;

export const statePrefixRegex = /^(?:is-|has-|js-)/i;

export const stateTokens = new Set(["focus", "hover", "active", "visited", "checked", "disabled", "open", "show", "hidden", "selected", "pressed"]);

export const storageKey = "tab-indexer";

export const transitionRegex = /(enter|leave|animat|transition|fade|slide)/i;

export const uniqueAttributes = ["data-testid", "aria-label", "name", "href", "data-id"];

export const unitDurations = { minute: 60 * 1000 };
