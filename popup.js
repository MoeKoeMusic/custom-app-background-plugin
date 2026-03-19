(() => {
  "use strict";

  const STORAGE_KEY = "customAppBackground";
  const DEFAULT_CONFIG = {
    enabled: false,
    imagePath: "",
    opacity: 0.35
  };

  const pathText = document.getElementById("pathText");
  const pickButton = document.getElementById("pickButton");
  const enabledToggle = document.getElementById("enabledToggle");
  const opacityRange = document.getElementById("opacityRange");
  const opacityLabel = document.getElementById("opacityLabel");
  const clearButton = document.getElementById("clearButton");
  const saveButton = document.getElementById("saveButton");
  const statusText = document.getElementById("statusText");

  let pendingConfig = { ...DEFAULT_CONFIG };

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

  function setStatus(message, type = "") {
    statusText.textContent = message;
    statusText.className = `status ${type}`.trim();
  }

  function render() {
    pathText.textContent = pendingConfig.imagePath || "未选择图片";
    enabledToggle.checked = pendingConfig.enabled;
    opacityRange.value = String(Math.round(pendingConfig.opacity * 100));
    opacityLabel.textContent = `${Math.round(pendingConfig.opacity * 100)}%`;
  }

  function storageGet(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => resolve(result[key]));
    });
  }

  function storageSet(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => resolve());
    });
  }

  async function pickPathViaElectronApi() {
    if (
      typeof window === "undefined" ||
      !window.electronAPI ||
      typeof window.electronAPI.showOpenDialog !== "function"
    ) {
      return { ok: false, reason: "electron_api_unavailable" };
    }

    try {
      const result = await window.electronAPI.showOpenDialog({
        title: "选择背景图片",
        properties: ["openFile"],
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp"]
          }
        ]
      });

      if (result && result.success && typeof result.filePath === "string" && result.filePath.trim()) {
        return { ok: true, path: result.filePath.trim() };
      }

      if (result && result.success === false) {
        return { ok: false, reason: "canceled" };
      }
    } catch (error) {
      return {
        ok: false,
        reason: "electron_api_error",
        message: error && error.message ? error.message : String(error)
      };
    }

    return { ok: false, reason: "electron_api_failed" };
  }

  async function loadConfig() {
    const saved = await storageGet(STORAGE_KEY);
    pendingConfig = normalizeConfig(saved || DEFAULT_CONFIG);
    render();
  }

  async function saveConfig() {
    if (!pendingConfig.imagePath) {
      pendingConfig.enabled = false;
    }

    pendingConfig = normalizeConfig(pendingConfig);
    await storageSet({ [STORAGE_KEY]: pendingConfig });
    render();
    setStatus("已保存，重启后会按路径自动恢复。", "success");
  }

  function applyPickedPath(filePath) {
    pendingConfig.imagePath = filePath;
    pendingConfig.enabled = true;
    render();
    setStatus("图片已选择，点击保存即可生效。", "success");
  }

  pickButton.addEventListener("click", async () => {
    setStatus("正在打开文件框...");

    const picked = await pickPathViaElectronApi();
    if (picked.ok) {
      applyPickedPath(picked.path);
      return;
    }

    if (picked.reason === "canceled") {
      setStatus("已取消选择。");
      return;
    }

    setStatus("Cannot read local path in current context.", "error");
  });

  opacityRange.addEventListener("input", (event) => {
    pendingConfig.opacity = clampOpacity(Number(event.target.value) / 100);
    opacityLabel.textContent = `${Math.round(pendingConfig.opacity * 100)}%`;
  });

  enabledToggle.addEventListener("change", (event) => {
    pendingConfig.enabled = Boolean(event.target.checked);
  });

  clearButton.addEventListener("click", async () => {
    pendingConfig = { ...DEFAULT_CONFIG };
    await storageSet({ [STORAGE_KEY]: pendingConfig });
    render();
    setStatus("已清除背景配置。", "success");
  });

  saveButton.addEventListener("click", async () => {
    await saveConfig();
  });

  loadConfig().catch((error) => {
    console.error("[custom-app-background] load config failed:", error);
    setStatus("加载配置失败。", "error");
  });
})();
