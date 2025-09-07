import { useEffect, useMemo, useState } from "react";

export default function useCurrentUrl() {
  const [currentUrl, setCurrentUrl] = useState("");
  const cleanUrl = useMemo(() => {
    if (!currentUrl) return "";
    const url = new URL(currentUrl);
    return url.protocol.startsWith("http") ? url.origin + url.pathname : "";
  }, [currentUrl]);

  useEffect(() => {
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => tab?.url && setCurrentUrl(tab.url))
      .catch((error) => console.error("Error getting current URL:", error));
  }, []);

  return [currentUrl, cleanUrl] as const;
}
