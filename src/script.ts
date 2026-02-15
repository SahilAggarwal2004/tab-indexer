import { focusableAttributes, selectionKey } from "./constants";
import { Callback, CompletedSelection, ConfigStorage } from "./types";
import { clearHighlights, createOverlay, generateSelector, getTargetElement, hasFocusable, highlightElement, initDOM, removeOverlay, showTemporaryMessage } from "./utils/dom";
import { findMatchingConfig, getStorage, registerStorageChangeListener, setEnabled } from "./utils/storage/app";
import { removeItem, setItem } from "./utils/storage/browser";
import { applyConfig, resetTabIndices } from "./utils/tabIndexer";

const debounceTimers = new Map<Callback, number>();

let controller: AbortController | null = null;
let domObserver: MutationObserver | null = null;
let isSelectingMode = false;

async function applyConfigIfExists(storage?: ConfigStorage) {
  try {
    if (!storage) storage = await getStorage();
    if (!storage.isEnabled) return resetTabIndices();

    const config = findMatchingConfig(storage.configs, location.href);
    if (config) applyConfig(config.selectors);
  } catch {
    showTemporaryMessage("Error applying config");
  }
}

export function debounce(callback: Callback, delay = 250) {
  const existing = debounceTimers.get(callback);
  if (existing) clearTimeout(existing);

  const timer = window.setTimeout(() => {
    callback();
    debounceTimers.delete(callback);
  }, delay); // Debounce to avoid excessive calls

  debounceTimers.set(callback, timer);
}

function handleElementClick(event: MouseEvent) {
  if (!isSelectingMode) return;

  event.preventDefault();
  event.stopPropagation();

  const element = getTargetElement(event);
  if (!element) return;

  const selector = generateSelector(element);

  if (selector) {
    // Store the selected selector in Chrome storage for the popup to retrieve
    setItem<CompletedSelection>(selectionKey, { flag: false, selector, timestamp: Date.now() })
      .then(async () => {
        showTemporaryMessage(`Selected: ${selector}`);
        stopElementSelection();

        // Auto-reopen the popup via background script
        chrome.runtime.sendMessage({ type: "openPopup" }).catch(() => showTemporaryMessage("Could not auto-open popup"));
      })
      .catch(() => showTemporaryMessage("Error saving selection"));
  } else showTemporaryMessage("Unable to generate a reliable selector for this element");
}

function handleEvent(event: MouseEvent, callback: Callback<[HTMLElement]>) {
  if (!isSelectingMode) return;

  const element = getTargetElement(event);
  if (!element) return;

  callback(element);
}

async function init() {
  await applyConfigIfExists();
  registerStorageChangeListener(() => debounce(applyConfigIfExists));
  initDOM();
  setupKeyboardShortcuts();
  setupMessageListener();
  setupDOMObserver();
}

function setupDOMObserver() {
  domObserver?.disconnect();

  let lastUrl = location.href;

  domObserver = new MutationObserver((mutations) => {
    // Handle URL changes (for SPAs)
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      return debounce(applyConfigIfExists);
    }

    // Handle DOM changes that might affect focusable elements
    let hasRelevantChanges = false;

    for (const mutation of mutations) {
      if (hasRelevantChanges) break;

      switch (mutation.type) {
        case "attributes":
          // Check if the attribute change affects focusability
          hasRelevantChanges = hasFocusable(mutation.target as Element);
          break;

        case "childList":
          // Check if focusable elements were added
          hasRelevantChanges = Array.from(mutation.addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE && hasFocusable(node as Element));
          break;
      }
    }

    if (hasRelevantChanges) debounce(applyConfigIfExists);
  });

  domObserver.observe(document, {
    attributes: true,
    attributeFilter: focusableAttributes,
    childList: true,
    subtree: true,
  });
}

async function setupKeyboardShortcuts() {
  document.addEventListener("keydown", async (e) => {
    // Handle ESC key during selection
    if (e.key === "Escape" && isSelectingMode) {
      e.preventDefault();
      return removeItem(selectionKey).then(stopElementSelection);
    }

    if (e.ctrlKey && e.shiftKey) {
      switch (e.code) {
        case "KeyA":
          e.preventDefault();
          setEnabled(true);
          break;
        case "KeyD":
          e.preventDefault();
          setEnabled(false);
          break;
      }
    }
  });
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.action) {
      case "startElementSelection":
        startElementSelection()
          .then(() => sendResponse({ success: true }))
          .catch(() => sendResponse({ success: false }));
        return true; // keep the message channel open for async sendResponse

      default:
        sendResponse({ success: false, error: "Unknown action" });
    }
  });
}

async function startElementSelection() {
  await setItem<CompletedSelection>(selectionKey, { flag: true, timestamp: Date.now() });

  // Stop any existing selection first
  if (isSelectingMode) stopElementSelection();

  isSelectingMode = true;
  controller = new AbortController();
  const { signal } = controller;

  createOverlay();
  document.addEventListener("click", handleElementClick, { capture: true, signal });
  document.addEventListener("mouseover", (event) => handleEvent(event, highlightElement), { capture: true, signal });
  document.addEventListener("mouseout", (event) => handleEvent(event, clearHighlights), { capture: true, signal });

  // Add visual feedback that selection mode is active
  document.body.style.cursor = "crosshair";
}

function stopElementSelection() {
  isSelectingMode = false;

  removeOverlay();
  controller?.abort();
  controller = null;

  // Restore normal cursor
  document.body.style.cursor = "";
}

// Listen for page unload to cleanup
window.addEventListener("beforeunload", () => {
  domObserver?.disconnect();
  debounceTimers.forEach((timer) => clearTimeout(timer));
  stopElementSelection();
});

// Initialize when DOM is ready
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
