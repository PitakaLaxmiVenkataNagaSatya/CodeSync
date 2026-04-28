// popup.js - CodeSync setup and compact settings view

const SETTINGS_KEY = "settings";
const POPUP_DRAFT_KEY = "popupDraft";
const SYNCED_PROBLEMS_KEY = "syncedProblems";

const DEFAULT_CONFIG = {
  enabled: false,
  username: "",
  repoOwner: "",
  repoName: "",
  githubToken: "",
  syncMode: "manual",
  setupComplete: false,
};

let settings = createDefaultSettings();
let draft = null;
let isEditing = false;
let isRestoringDraft = false;

const $ = (id) => document.getElementById(id);

function createDefaultSettings() {
  return {
    version: 2,
    platforms: {
      leetcode: { ...DEFAULT_CONFIG },
    },
  };
}

function sanitizeConfig(raw = {}) {
  const config = { ...DEFAULT_CONFIG, ...raw };
  config.enabled = Boolean(config.enabled);
  config.username = (config.username || "").trim();
  config.repoOwner = (config.repoOwner || "").trim();
  config.repoName = (config.repoName || "").trim();
  config.githubToken = (config.githubToken || "").trim();
  config.syncMode = ["manual", "automatic"].includes(config.syncMode)
    ? config.syncMode
    : "manual";
  config.setupComplete =
    config.enabled &&
    Boolean(config.username && config.repoOwner && config.repoName && config.githubToken);
  return config;
}

function sanitizeSettings(raw = {}) {
  return {
    version: 2,
    platforms: {
      leetcode: sanitizeConfig(raw.platforms?.leetcode),
    },
  };
}

async function migrateLegacySettings() {
  const stored = await chrome.storage.sync.get([
    SETTINGS_KEY,
    "githubToken",
    "repoOwner",
    "repoName",
    "leetcodeUsername",
  ]);

  if (stored[SETTINGS_KEY]?.version === 2) {
    return sanitizeSettings(stored[SETTINGS_KEY]);
  }

  const next = sanitizeSettings(stored[SETTINGS_KEY]);
  if (!stored[SETTINGS_KEY] && (stored.githubToken || stored.repoOwner || stored.repoName)) {
    next.platforms.leetcode = sanitizeConfig({
      enabled: Boolean(stored.githubToken && stored.repoOwner && stored.repoName),
      username: stored.leetcodeUsername || "",
      repoOwner: stored.repoOwner || "",
      repoName: stored.repoName || "",
      githubToken: stored.githubToken || "",
      syncMode: "manual",
    });
  }

  await chrome.storage.sync.set({ [SETTINGS_KEY]: next });
  return next;
}

async function loadDraft() {
  const stored = await chrome.storage.local.get([POPUP_DRAFT_KEY]);
  if (!stored[POPUP_DRAFT_KEY]) return null;
  return sanitizeConfig(stored[POPUP_DRAFT_KEY].leetcode);
}

async function saveDraft() {
  if (isRestoringDraft) return;
  const config = readFormConfig();
  await chrome.storage.local.set({
    [POPUP_DRAFT_KEY]: {
      leetcode: sanitizeConfig(config),
      savedAt: new Date().toISOString(),
    },
  });
}

async function clearDraft() {
  await chrome.storage.local.remove([POPUP_DRAFT_KEY]);
}

function readFormConfig() {
  return {
    enabled: true,
    username: $("leetcodeUsername").value,
    repoOwner: $("repoOwner").value,
    repoName: $("repoName").value,
    githubToken: $("githubToken").value,
    syncMode: $("syncMode").value,
  };
}

function fillForm(config) {
  $("leetcodeUsername").value = config.username || "";
  $("repoOwner").value = config.repoOwner || "";
  $("repoName").value = config.repoName || "";
  $("githubToken").value = config.githubToken || "";
  $("syncMode").value = config.syncMode || "manual";
}

function showStatus(message, isError = false) {
  const el = $("status");
  el.textContent = message;
  el.className = `status show ${isError ? "error" : "success"}`;
}

function clearStatus() {
  const el = $("status");
  el.textContent = "";
  el.className = "status";
}

async function renderReadyState() {
  const local = await chrome.storage.local.get([SYNCED_PROBLEMS_KEY]);
  const allEntries = Object.values(local[SYNCED_PROBLEMS_KEY] || {});
  const leetcodeEntries = allEntries.filter((entry) => entry.platform === "leetcode");
  const config = settings.platforms.leetcode;

  $("welcomeView").hidden = true;
  $("formView").hidden = true;
  $("readyView").hidden = false;

  $("readyUsername").textContent = config.username || "Not set";
  $("readyRepo").textContent =
    config.repoOwner && config.repoName ? `${config.repoOwner}/${config.repoName}` : "Not set";
  $("readyMode").textContent = config.syncMode;
  $("readyCount").textContent = String(leetcodeEntries.length);
}

function renderFormState(config) {
  $("readyView").hidden = true;
  $("welcomeView").hidden = false;
  $("formView").hidden = false;
  $("welcomeTitle").textContent = isEditing ? "Edit your setup" : "Welcome, let's get started";
  $("welcomeText").textContent = isEditing
    ? "Update your LeetCode username, repository details, token, or sync mode."
    : "Connect LeetCode to GitHub. Manual is the default, so nothing syncs until you choose it or click the button after acceptance.";
  fillForm(config);
}

async function persistSettings() {
  const config = sanitizeConfig(readFormConfig());
  const next = {
    version: 2,
    platforms: {
      leetcode: config,
    },
  };

  await chrome.storage.sync.set({ [SETTINGS_KEY]: next });
  settings = next;
  await clearDraft();
}

async function handleSave() {
  clearStatus();

  const config = sanitizeConfig(readFormConfig());
  if (!config.username || !config.repoOwner || !config.repoName || !config.githubToken) {
    showStatus("Please fill in your LeetCode username, repo owner, repo name, and token.", true);
    return;
  }

  try {
    await persistSettings();
    showStatus("Saved. Closing setup...");
    window.setTimeout(() => window.close(), 250);
  } catch (error) {
    showStatus(`Could not save settings: ${error.message}`, true);
  }
}

async function handleEdit() {
  isEditing = true;
  const config = draft || settings.platforms.leetcode;
  renderFormState(config);
  clearStatus();
  await saveDraft();
}

async function init() {
  settings = await migrateLegacySettings();
  draft = await loadDraft();

  $("saveBtn").addEventListener("click", handleSave);
  $("editBtn").addEventListener("click", handleEdit);
  $("toggleToken").addEventListener("click", () => {
    const input = $("githubToken");
    const btn = $("toggleToken");
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    btn.textContent = visible ? "show" : "hide";
  });

  document.querySelectorAll("[data-autosave]").forEach((el) => {
    el.addEventListener("input", saveDraft);
    el.addEventListener("change", saveDraft);
  });

  isRestoringDraft = true;
  if (draft) {
    renderFormState(draft);
  } else if (settings.platforms.leetcode.setupComplete) {
    await renderReadyState();
  } else {
    renderFormState(settings.platforms.leetcode);
  }
  isRestoringDraft = false;
}

init();
