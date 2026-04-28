// content.js - LeetCode accepted submission detector and sync trigger

(function () {
  "use strict";

  const SETTINGS_KEY = "settings";
  const SUBMIT_WINDOW_MS = 90000;
  const SUBMIT_ARM_KEY = "codesync.leet.submitArmedAt";
  const SUBMISSION_SNAPSHOT_KEY = "codesync.leet.pendingSubmission";
  const MANUAL_BUTTON_ID = "leet-sync-manual-button";
  const BUTTON_STYLES = {
    default: { background: "#2563eb", color: "#ffffff", text: "Sync to GitHub" },
    synced: { background: "#16a34a", color: "#ffffff", text: "Synced" },
    up_to_date: { background: "#6b7280", color: "#ffffff", text: "Already up to date" },
  };
  const NOTICE_STYLES = {
    synced: "#16a34a",
    up_to_date: "#6b7280",
    error: "#b3261e",
  };

  const LANG_EXTENSION_MAP = {
    cpp: "cpp",
    "c++": "cpp",
    java: "java",
    python: "py",
    python3: "py",
    py: "py",
    c: "c",
    csharp: "cs",
    "c#": "cs",
    javascript: "js",
    typescript: "ts",
    go: "go",
    ruby: "rb",
    swift: "swift",
    kotlin: "kt",
    rust: "rs",
    scala: "scala",
    php: "php",
    dart: "dart",
    racket: "rkt",
    elixir: "ex",
    erlang: "erl",
  };

  const state = {
    settings: null,
    config: null,
    lastAcceptanceKey: "",
    lastLeetCodePayload: null,
    pendingPayload: null,
    submitArmedAt: 0,
    acceptedHandled: false,
    currentUrl: window.location.href,
    currentProblemSlug: "",
  };

  let submissionWatcherId = 0;

  function hasExtensionContext() {
    try {
      return Boolean(globalThis.chrome?.runtime?.id);
    } catch (_) {
      return false;
    }
  }

  async function safeStorageGet(keys) {
    if (!hasExtensionContext()) return {};
    try {
      return await chrome.storage.sync.get(keys);
    } catch (_) {
      return {};
    }
  }

  function createDefaultSettings() {
    return {
      version: 2,
      platforms: {
        leetcode: {
          enabled: false,
          username: "",
          repoOwner: "",
          repoName: "",
          githubToken: "",
          syncMode: "manual",
          setupComplete: false,
        },
      },
    };
  }

  function sanitizeSettings(raw = {}) {
    const defaults = createDefaultSettings();
    const config = {
      ...defaults.platforms.leetcode,
      ...(raw.platforms?.leetcode || {}),
    };
    config.enabled = Boolean(config.enabled);
    config.username = (config.username || "").trim();
    config.repoOwner = (config.repoOwner || "").trim();
    config.repoName = (config.repoName || "").trim();
    config.githubToken = (config.githubToken || "").trim();
    config.syncMode = ["automatic", "manual"].includes(config.syncMode)
      ? config.syncMode
      : "manual";
    config.setupComplete =
      config.enabled &&
      Boolean(config.username && config.repoOwner && config.repoName && config.githubToken);
    return { version: 2, platforms: { leetcode: config } };
  }

  function normalizeUsername(value) {
    return (value || "").trim().toLowerCase();
  }

  function sanitizeSlug(value) {
    return (value || "problem")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normalizeTopic(topic) {
    return sanitizeSlug((topic || "misc").replace(/_/g, " ")) || "misc";
  }

  function getCurrentProblemSlug() {
    return window.location.pathname.match(/\/problems\/([^/]+)/)?.[1] || "";
  }

  function markRecentSubmit() {
    const timestamp = Date.now();
    state.submitArmedAt = timestamp;
    state.acceptedHandled = false;
    try {
      sessionStorage.setItem(SUBMIT_ARM_KEY, String(timestamp));
    } catch (_) {}
  }

  function clearRecentSubmit() {
    state.submitArmedAt = 0;
    try {
      sessionStorage.removeItem(SUBMIT_ARM_KEY);
    } catch (_) {}
  }

  function getRecentSubmitAt() {
    if (state.submitArmedAt) return state.submitArmedAt;
    try {
      const raw = sessionStorage.getItem(SUBMIT_ARM_KEY);
      const parsed = raw ? Number(raw) : 0;
      if (Number.isFinite(parsed) && parsed > 0) {
        state.submitArmedAt = parsed;
        return parsed;
      }
    } catch (_) {}
    return 0;
  }

  function withinSubmitWindow() {
    const lastSubmitAt = getRecentSubmitAt();
    return Boolean(lastSubmitAt && Date.now() - lastSubmitAt <= SUBMIT_WINDOW_MS);
  }

  async function saveSubmissionSnapshot() {
    const code = await getCodeFromEditor();
    const lang = getLanguage();
    const snapshot = {
      code: code || "",
      lang,
      savedAt: Date.now(),
    };
    try {
      sessionStorage.setItem(SUBMISSION_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch (_) {}
    return snapshot;
  }

  function getSubmissionSnapshot() {
    try {
      const raw = sessionStorage.getItem(SUBMISSION_SNAPSHOT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      if (!parsed.savedAt || Date.now() - parsed.savedAt > SUBMIT_WINDOW_MS) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function clearSubmissionSnapshot() {
    try {
      sessionStorage.removeItem(SUBMISSION_SNAPSHOT_KEY);
    } catch (_) {}
  }

  function resetProblemState() {
    hideManualButton();
    state.pendingPayload = null;
    state.acceptedHandled = false;
    clearRecentSubmit();
    clearSubmissionSnapshot();
  }

  async function loadSettings() {
    const stored = await safeStorageGet([SETTINGS_KEY]);
    state.settings = sanitizeSettings(stored[SETTINGS_KEY]);
    state.config = state.settings.platforms.leetcode;
  }

  function hideManualButton() {
    const existing = document.getElementById(MANUAL_BUTTON_ID);
    if (existing) existing.remove();
  }

  function setManualButtonState(button, mode) {
    const style = BUTTON_STYLES[mode] || BUTTON_STYLES.default;
    button.textContent = style.text;
    button.style.background = style.background;
    button.style.color = style.color;
  }

  function showManualButton(payload, mode = "default") {
    if (!payload) return;
    hideManualButton();

    const button = document.createElement("button");
    button.id = MANUAL_BUTTON_ID;
    Object.assign(button.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "2147483647",
      padding: "12px 18px",
      border: "none",
      borderRadius: "999px",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      boxShadow: "0 10px 24px rgba(0, 0, 0, 0.25)",
    });
    setManualButtonState(button, mode);
    button.addEventListener("click", () => sendForSync(payload, true));
    document.body.appendChild(button);
  }

  function showNotification(message, mode = "synced") {
    const el = document.createElement("div");
    el.textContent = message;
    Object.assign(el.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "2147483647",
      maxWidth: "380px",
      padding: "12px 18px",
      borderRadius: "10px",
      background: NOTICE_STYLES[mode] || NOTICE_STYLES.synced,
      color: "#ffffff",
      fontSize: "13px",
      fontWeight: "600",
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
    });
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 250);
    }, 3200);
  }

  function requestInjectedCode() {
    return new Promise((resolve) => {
      const requestId = `leet-sync-${Date.now()}-${Math.random()}`;
      const timeout = setTimeout(() => {
        window.removeEventListener("message", handler);
        resolve(null);
      }, 1500);

      function handler(event) {
        if (event.source !== window) return;
        if (event.data?.type !== "LEETSYNC_CODE_RESPONSE") return;
        if (event.data.requestId !== requestId) return;
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        resolve(event.data.code || null);
      }

      window.addEventListener("message", handler);
      if (!hasExtensionContext()) {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        resolve(null);
        return;
      }
      window.postMessage({ type: "LEETSYNC_GET_CODE", requestId }, "*");
    });
  }

  async function getCodeFromEditor() {
    const injected = await requestInjectedCode();
    if (injected && injected.trim()) return injected;

    const textarea = document.querySelector(
      "textarea, textarea[name='source'], textarea[name='solution'], .inputarea"
    );
    if (textarea && textarea.value && textarea.value.trim()) {
      return textarea.value;
    }

    const codeMirrorLines = Array.from(
      document.querySelectorAll(".CodeMirror-line, .cm-line, .view-lines .view-line")
    )
      .map((el) => el.textContent)
      .filter(Boolean);
    if (codeMirrorLines.length) {
      return codeMirrorLines.join("\n");
    }

    return null;
  }

  function getButtonText(element) {
    return (element?.textContent || "").trim().toLowerCase();
  }

  function watchSubmitClicks() {
    document.addEventListener(
      "click",
      (event) => {
        const button = event.target instanceof Element
          ? event.target.closest("button, input[type='submit'], [role='button'], a")
          : null;
        if (!button) return;

        const text = getButtonText(button);
        const locator = button.getAttribute("data-e2e-locator") || "";
      const looksLikeSubmit =
          text === "submit" ||
          text === "submit code" ||
          locator === "console-submit-button";

        if (looksLikeSubmit) {
          hideManualButton();
          markRecentSubmit();
          void saveSubmissionSnapshot().catch(() => {});
        }
      },
      true
    );
  }

  function getCurrentUsername() {
    const selectors = [
      'a[href^="/u/"]',
      'a[href*="/u/"]',
      'button img[alt*="avatar"]',
      '[data-cy="user-avatar"]',
    ];
    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        const href = node.getAttribute("href") || "";
        const text = (node.textContent || node.getAttribute("title") || "").trim();
        const match = href.match(/\/(?:u|profile|users?)\/([^/?#]+)/i) || href.match(/@([^/?#]+)/);
        if (match?.[1]) return match[1];
        if (text && text.length < 40 && !/login|sign in/i.test(text)) return text;
      }
    }
    return null;
  }

  function getProblemTitle() {
    const selectors = [
      '[data-cy="question-title"]',
      "div[class*='text-title-large'] a",
      "div[class*='text-title-large']",
      "h1",
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = (el?.textContent || "").trim();
      if (text) return text.replace(/^\d+[.):-]\s*/, "");
    }

    const problemSlug = getCurrentProblemSlug();
    const pathPart = problemSlug || window.location.pathname.split("/").filter(Boolean).pop() || "problem";
    return pathPart
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getProblemNumber() {
    const selectors = [
      '[data-cy="question-title"]',
      "div[class*='text-title-large'] a",
      "div[class*='text-title-large']",
      "title",
    ];

    for (const selector of selectors) {
      const el = selector === "title" ? document.querySelector("title") : document.querySelector(selector);
      const text = (el?.textContent || "").trim();
      const match = text.match(/^(\d+)\.\s/) || text.match(/^(\d+)\s*[-:)]/);
      if (match?.[1]) return match[1];
    }

    return "";
  }

  function getDifficulty() {
    const bodyText = document.body.innerText || "";
    const selectors = [
      "[class*='difficulty']",
      "[class*='text-olive']",
      "[class*='text-yellow']",
      "[class*='text-pink']",
      "[class*='easy']",
      "[class*='medium']",
      "[class*='hard']",
    ];

    for (const selector of selectors) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        const text = (node.textContent || "").trim().toLowerCase();
        if (text === "easy") return "easy";
        if (text === "medium" || text === "med.") return "medium";
        if (text === "hard") return "hard";
      }
    }

    if (/\beasy\b/i.test(bodyText)) return "easy";
    if (/\bmedium\b/i.test(bodyText)) return "medium";
    if (/\bhard\b/i.test(bodyText)) return "hard";
    return "unknown";
  }

  function getTopics() {
    const tags = new Set();
    for (const selector of ['a[href^="/tag/"]', 'a[href*="/tag/"]']) {
      document.querySelectorAll(selector).forEach((el) => {
        const text = (el.textContent || "").trim();
        if (text && text.length < 48) tags.add(normalizeTopic(text));
      });
    }

    return Array.from(tags);
  }

  function getLanguage() {
    const selectors = [
      "select option:checked",
      'button[id*="headlessui-popover-button"]',
      ".language-select .active",
      ".css-1hwfws3",
      "[data-lang]",
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = (el?.textContent || el?.getAttribute?.("data-lang") || "").trim();
      if (text && text.length < 40) return text.toLowerCase();
    }
    return "text";
  }

  function getFileExtension(lang) {
    const normalized = (lang || "text").toLowerCase().replace(/\s+/g, "");
    return LANG_EXTENSION_MAP[normalized] || "txt";
  }

  function getProblemUrl() {
    const problemSlug = getCurrentProblemSlug();
    if (problemSlug) {
      return `${window.location.origin}/problems/${problemSlug}/`;
    }
    return window.location.origin + window.location.pathname;
  }

  function getPlatformSpecificSlug(title) {
    const match = getCurrentProblemSlug();
    if (match) return sanitizeSlug(match);
    return sanitizeSlug(title || window.location.pathname.split("/").pop());
  }

  async function collectPayload(signal) {
    await loadSettings();

    if (!state.config?.enabled || !state.config?.setupComplete) {
      hideManualButton();
      return null;
    }

    const detectedUsername = getCurrentUsername();
    if (!detectedUsername) {
      hideManualButton();
      return null;
    }

    if (normalizeUsername(detectedUsername) !== normalizeUsername(state.config.username)) {
      hideManualButton();
      return null;
    }

    if (!signal?.accepted) return null;
    if (!withinSubmitWindow()) return null;

    const title = getProblemTitle();
    const slug = getPlatformSpecificSlug(title);
    const acceptanceKey = `${slug}:${signal.submissionId || "accepted"}`;
    if (acceptanceKey === state.lastAcceptanceKey) return null;

    let code = await getCodeFromEditor();
    const snapshot = getSubmissionSnapshot();
    if ((!code || !code.trim()) && snapshot?.code?.trim()) {
      code = snapshot.code;
    }
    if (!code || !code.trim()) return null;

    state.lastAcceptanceKey = acceptanceKey;

    const lang = signal.langHint || snapshot?.lang || getLanguage();
    return {
      type: "SYNC_TO_GITHUB",
      platform: "leetcode",
      title,
      problemNumber: getProblemNumber(),
      slug,
      difficulty: getDifficulty(),
      code,
      lang,
      ext: getFileExtension(lang),
      topics: getTopics(),
      problemUrl: getProblemUrl(),
      submissionId: signal.submissionId || "",
      submittedAt: new Date().toISOString(),
      detectedUsername,
    };
  }

  function sendForSync(payload, fromManualClick = false) {
    if (!payload) return;
    if (!hasExtensionContext()) return;
    try {
      chrome.runtime.sendMessage(payload, (response) => {
        const runtimeError = chrome.runtime?.lastError;
        if (runtimeError) {
          if (fromManualClick) {
            showNotification(`Sync failed: ${runtimeError.message}`, "error");
          }
          return;
        }

        if (response?.success) {
          if (fromManualClick) {
            showManualButton(payload, response.status || "synced");
          } else {
            if (response.status === "synced") {
              showNotification(response.message || "Synced", "synced");
            } else if (response.status === "up_to_date") {
              showNotification(response.message || "Already up to date", "up_to_date");
            }
          }
        } else if (!response?.ignored && fromManualClick) {
          showNotification(response?.error || response?.message || "Sync failed.", "error");
        }
      });
    } catch (_) {}
  }

  async function handleAcceptedSignal(signal) {
    if (state.acceptedHandled) return;
    const payload = await collectPayload(signal);
    if (!payload) return;

    state.acceptedHandled = true;
    state.pendingPayload = payload;
    clearRecentSubmit();
    clearSubmissionSnapshot();
    if (state.config.syncMode === "automatic") {
      hideManualButton();
      sendForSync(payload);
    } else if (state.config.syncMode === "manual") {
      showManualButton(payload);
    }
  }

  function injectPageScript() {
    if (!hasExtensionContext()) return;
    const script = document.createElement("script");
    try {
      script.src = chrome.runtime.getURL("src/injected.js");
    } catch (_) {
      return;
    }
    script.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  function listenForInjectedEvents() {
    window.addEventListener("message", async (event) => {
      if (event.source !== window) return;
      if (event.data?.type !== "LEETCODE_ACCEPTED") return;
      state.lastLeetCodePayload = event.data.payload || null;
      const recentSubmitAt = getRecentSubmitAt();
      if (!recentSubmitAt || Date.now() - recentSubmitAt > SUBMIT_WINDOW_MS) {
        return;
      }
      await handleAcceptedSignal({
        accepted: true,
        submissionId: event.data.payload?.submissionId || "",
        langHint: event.data.payload?.lang || "",
      });
    });
  }

  function isSubmissionPage() {
    return /\/problems\/[^/]+\/submissions\/\d+\/?/.test(window.location.pathname);
  }

  function getSubmissionIdFromPageUrl() {
    return window.location.pathname.match(/\/submissions\/(\d+)\/?/)?.[1] || "";
  }

  function pageShowsAccepted() {
    const bodyText = (document.body?.innerText || "").replace(/\s+/g, " ").trim();
    return /\baccepted\b/i.test(bodyText);
  }

  function startSubmissionFallbackWatcher() {
    if (submissionWatcherId) {
      window.clearInterval(submissionWatcherId);
      submissionWatcherId = 0;
    }

    if (!isSubmissionPage()) return;

    let attempts = 0;
    submissionWatcherId = window.setInterval(() => {
      attempts += 1;
      if (state.acceptedHandled || !withinSubmitWindow()) {
        window.clearInterval(submissionWatcherId);
        submissionWatcherId = 0;
        return;
      }

      if (!pageShowsAccepted()) {
        if (attempts >= 45) {
          window.clearInterval(submissionWatcherId);
          submissionWatcherId = 0;
        }
        return;
      }

      window.clearInterval(submissionWatcherId);
      submissionWatcherId = 0;
      void handleAcceptedSignal({
        accepted: true,
        submissionId: getSubmissionIdFromPageUrl(),
        langHint: getLanguage(),
      });
    }, 1000);
  }

  function handleRouteChange() {
    const nextUrl = window.location.href;
    if (nextUrl === state.currentUrl) return;

    const previousProblemSlug = state.currentProblemSlug;
    const nextProblemSlug = getCurrentProblemSlug();

    state.currentUrl = nextUrl;
    state.currentProblemSlug = nextProblemSlug;

    if (previousProblemSlug && nextProblemSlug && previousProblemSlug !== nextProblemSlug) {
      resetProblemState();
    } else if (!nextProblemSlug) {
      hideManualButton();
    }

    startSubmissionFallbackWatcher();
  }

  function watchRouteChanges() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      handleRouteChange();
      return result;
    };

    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      handleRouteChange();
      return result;
    };

    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("hashchange", handleRouteChange);
  }

  function initStorageListener() {
    if (!hasExtensionContext()) return;
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "sync" || !changes[SETTINGS_KEY]) return;
        state.settings = sanitizeSettings(changes[SETTINGS_KEY].newValue || {});
        state.config = state.settings.platforms.leetcode;
        if (!state.config?.enabled || state.config.syncMode !== "manual") {
          hideManualButton();
        }
      });
    } catch (_) {}
  }

  let hooksStarted = false;

  function startHooks() {
    if (hooksStarted) return;
    hooksStarted = true;
    state.currentProblemSlug = getCurrentProblemSlug();
    listenForInjectedEvents();
    startSubmissionFallbackWatcher();
    initStorageListener();
    watchSubmitClicks();
    watchRouteChanges();
    injectPageScript();
  }

  async function init() {
    await loadSettings();
  }

  startHooks();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      void init().catch(() => {});
    }, { once: true });
  } else {
    void init().catch(() => {});
  }
})();
