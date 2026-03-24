(function () {
  "use strict";

  const STORAGE_KEY = "customAppBackground";
  const LAYER_ID = "moekoe-custom-app-bg-layer";
  const ENABLED_CLASS = "mk-custom-bg-enabled";
  const LYRICS_ROUTE_PATTERN = /^#\/?lyrics(?:[/?]|$)/i;
  const DEFAULT_CONFIG = {
    enabled: false,
    imagePath: "",
    opacity: 0.35
  };

  function clampOpacity(value) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return DEFAULT_CONFIG.opacity;
    return Math.min(1, Math.max(0, numeric));
  }

  function normalizeConfig(config) {
    const next = config && typeof config === "object" ? config : {};
    return {
      enabled: Boolean(next.enabled),
      imagePath: typeof next.imagePath === "string" ? next.imagePath.trim() : "",
      opacity: clampOpacity(next.opacity)
    };
  }

  function toFileUrl(rawPath) {
    if (!rawPath) return "";
    if (/^file:\/\//i.test(rawPath)) return rawPath;

    const normalizedPath = rawPath.replace(/\\/g, "/");
    const encodedPath = encodeURI(normalizedPath)
      .replace(/#/g, "%23")
      .replace(/\?/g, "%3F");

    if (/^[a-zA-Z]:\//.test(encodedPath)) {
      return `file:///${encodedPath}`;
    }
    if (encodedPath.startsWith("/")) {
      return `file://${encodedPath}`;
    }
    return `file://${encodedPath}`;
  }

  function escapeCssUrl(url) {
    return url.replace(/"/g, '\\"');
  }

  function ensureLayer() {
    if (!document.body) return null;
    let layer = document.getElementById(LAYER_ID);
    if (layer) return layer;

    layer = document.createElement("div");
    layer.id = LAYER_ID;
    document.body.prepend(layer);
    return layer;
  }

  function disableBackground() {
    const layer = document.getElementById(LAYER_ID);
    if (layer) {
      layer.remove();
    }
    document.documentElement.classList.remove(ENABLED_CLASS);
  }

  function isLyricsPage() {
    const hash = window.location.hash || "";
    if (LYRICS_ROUTE_PATTERN.test(hash)) {
      return true;
    }

    const pathname = window.location.pathname || "";
    return /\/lyrics\/?$/i.test(pathname);
  }

  function applyBackground(rawConfig) {
    const config = normalizeConfig(rawConfig);
    const appRoot = document.getElementById("app");

    if (!appRoot || isLyricsPage() || !config.enabled || !config.imagePath) {
      disableBackground();
      return;
    }

    const layer = ensureLayer();
    if (!layer) return;

    const fileUrl = toFileUrl(config.imagePath);
    if (!fileUrl) {
      disableBackground();
      return;
    }

    layer.style.backgroundImage = `url("${escapeCssUrl(fileUrl)}")`;
    layer.style.opacity = String(config.opacity);
    document.documentElement.classList.add(ENABLED_CLASS);
  }

  function readConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        resolve(normalizeConfig(result[STORAGE_KEY] || DEFAULT_CONFIG));
      });
    });
  }

  async function init() {
    const config = await readConfig();
    applyBackground(config);

    const observer = new MutationObserver(() => {
      if (document.documentElement.classList.contains(ENABLED_CLASS)) {
        ensureLayer();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) return;
    applyBackground(changes[STORAGE_KEY].newValue || DEFAULT_CONFIG);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
