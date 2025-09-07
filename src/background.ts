chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case "openPopup":
      chrome.action.openPopup().catch(() => console.error("Could not auto-open popup"));
  }
});
