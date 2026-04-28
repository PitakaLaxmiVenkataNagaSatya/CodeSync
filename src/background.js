// background.js - multi-platform sync coordinator, config migration, and GitHub I/O

const SUPPORTED_PLATFORMS = [
  "leetcode",
  "codeforces",
  "codechef",
  "hackerrank",
  "hackerearth",
  "geeksforgeeks",
];

const PLATFORM_LABELS = {
  leetcode: "LeetCode",
  codeforces: "Codeforces",
  codechef: "CodeChef",
  hackerrank: "HackerRank",
  hackerearth: "HackerEarth",
  geeksforgeeks: "GeeksforGeeks",
};

const SETTINGS_VERSION = 2;
const SETTINGS_KEY = "settings";
const SYNCED_PROBLEMS_KEY = "syncedProblems";

const TOPIC_PRIORITY = [
  "monotonic-stack",
  "monotonic-queue",
  "segment-tree",
  "binary-indexed-tree",
  "fenwick-tree",
  "trie",
  "union-find",
  "disjoint-set",
  "ordered-set",
  "rolling-hash",
  "suffix-array",
  "topological-sort",
  "kmp",
  "manacher",
  "rabin-karp",
  "kruskal",
  "prim",
  "dijkstra",
  "bellman-ford",
  "floyd-warshall",
  "minimum-spanning-tree",
  "shortest-path",
  "eulerian-circuit",
  "strongly-connected-component",
  "biconnected-component",
  "game-theory",
  "reservoir-sampling",
  "dynamic-programming",
  "memoization",
  "backtracking",
  "two-pointers",
  "sliding-window",
  "binary-search",
  "divide-and-conquer",
  "greedy",
  "breadth-first-search",
  "depth-first-search",
  "bfs",
  "dfs",
  "recursion",
  "bitmask",
  "bit-manipulation",
  "enumeration",
  "heap-priority-queue",
  "heap",
  "priority-queue",
  "linked-list",
  "queue",
  "stack",
  "graph",
  "binary-search-tree",
  "binary-tree",
  "tree",
  "hash-table",
  "matrix",
  "string",
  "math",
  "prefix-sum",
  "sorting",
  "simulation",
  "array",
];

const ANALYSIS_RULES = [
  {
    pattern: /\bdp\b|memo|tabulation|bottom.?up|top.?down/i,
    algorithm: "Dynamic programming",
    strategy: "dp",
    timeComplexity: "O(n * m)",
    spaceComplexity: "O(n * m)",
    confidence: 0.86,
  },
  {
    pattern: /queue|deque|breadth.?first|\bbfs\b/i,
    algorithm: "Breadth-first search",
    strategy: "bfs",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    confidence: 0.82,
  },
  {
    pattern: /depth.?first|\bdfs\b|def\s+dfs|void\s+dfs/i,
    algorithm: "Depth-first search",
    strategy: "dfs",
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V)",
    confidence: 0.82,
  },
  {
    pattern: /binary[_\s]?search|lower_bound|upper_bound|bisect|\bmid\b/i,
    algorithm: "Binary search",
    strategy: "binary-search",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    confidence: 0.8,
  },
  {
    pattern: /two.?pointer|left.*right|slow.*fast/i,
    algorithm: "Two pointers",
    strategy: "two-pointers",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    confidence: 0.77,
  },
  {
    pattern: /sliding.?window|window/i,
    algorithm: "Sliding window",
    strategy: "sliding-window",
    timeComplexity: "O(n)",
    spaceComplexity: "O(k)",
    confidence: 0.74,
  },
  {
    pattern: /unordered_map|hashmap|hash_map|defaultdict|new\s+Map|dict\(/i,
    algorithm: "Hash map",
    strategy: "hashing",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    confidence: 0.8,
  },
  {
    pattern: /\.sort\s*\(|Arrays\.sort|Collections\.sort|sort\s*\(/i,
    algorithm: "Sorting",
    strategy: "sorting",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(log n)",
    confidence: 0.76,
  },
  {
    pattern: /stack|\.push\(|\.pop\(/i,
    algorithm: "Stack",
    strategy: "stack",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    confidence: 0.72,
  },
  {
    pattern: /heap|priorityqueue|priority_queue|heapq/i,
    algorithm: "Heap",
    strategy: "heap",
    timeComplexity: "O(n log k)",
    spaceComplexity: "O(k)",
    confidence: 0.72,
  },
  {
    pattern: /union.?find|disjoint.?set/i,
    algorithm: "Union find",
    strategy: "union-find",
    timeComplexity: "O(n * alpha(n))",
    spaceComplexity: "O(n)",
    confidence: 0.74,
  },
  {
    pattern: /trie|prefix.?tree/i,
    algorithm: "Trie",
    strategy: "trie",
    timeComplexity: "O(m)",
    spaceComplexity: "O(m * n)",
    confidence: 0.7,
  },
  {
    pattern: /backtrack|permut|combin/i,
    algorithm: "Backtracking",
    strategy: "backtracking",
    timeComplexity: "O(2^n)",
    spaceComplexity: "O(n)",
    confidence: 0.7,
  },
  {
    pattern: /<<|>>|\^|bitmask|popcount|__builtin/i,
    algorithm: "Bit manipulation",
    strategy: "bit-manipulation",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    confidence: 0.7,
  },
  {
    pattern: /for\s*\(.*for\s*\(|while\s*\(.*while\s*\(/i,
    algorithm: "Nested iteration",
    strategy: "brute-force",
    timeComplexity: "O(n^2)",
    spaceComplexity: "O(1)",
    confidence: 0.58,
  },
  {
    pattern: /for\s*\(|while\s*\(|\.forEach|for\s+\w+\s+in/i,
    algorithm: "Linear scan",
    strategy: "iteration",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    confidence: 0.45,
  },
];

function createEmptyPlatformConfig() {
  return {
    enabled: false,
    username: "",
    repoOwner: "",
    repoName: "",
    githubToken: "",
    syncMode: "manual",
    setupComplete: false,
  };
}

function createDefaultSettings() {
  const platforms = {};
  for (const platform of SUPPORTED_PLATFORMS) {
    platforms[platform] = createEmptyPlatformConfig();
  }
  return {
    version: SETTINGS_VERSION,
    platforms,
  };
}

function sanitizePlatformConfig(config = {}) {
  const normalized = {
    ...createEmptyPlatformConfig(),
    ...config,
  };
  normalized.enabled = Boolean(normalized.enabled);
  normalized.username = (normalized.username || "").trim();
  normalized.repoOwner = (normalized.repoOwner || "").trim();
  normalized.repoName = (normalized.repoName || "").trim();
  normalized.githubToken = (normalized.githubToken || "").trim();
  normalized.syncMode = ["automatic", "manual"].includes(normalized.syncMode)
    ? normalized.syncMode
    : "manual";
  normalized.setupComplete =
    normalized.enabled &&
    Boolean(
      normalized.username &&
        normalized.repoOwner &&
        normalized.repoName &&
        normalized.githubToken
    );
  return normalized;
}

function sanitizeSettings(rawSettings = {}) {
  const base = createDefaultSettings();
  const platforms = { ...base.platforms };
  const incomingPlatforms = rawSettings.platforms || {};

  for (const platform of SUPPORTED_PLATFORMS) {
    platforms[platform] = sanitizePlatformConfig(incomingPlatforms[platform]);
  }

  return {
    version: SETTINGS_VERSION,
    platforms,
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

  if (stored[SETTINGS_KEY]?.version === SETTINGS_VERSION) {
    return sanitizeSettings(stored[SETTINGS_KEY]);
  }

  const settings = sanitizeSettings(stored[SETTINGS_KEY]);

  if (!stored[SETTINGS_KEY] && (stored.githubToken || stored.repoOwner || stored.repoName)) {
    settings.platforms.leetcode = sanitizePlatformConfig({
      enabled: Boolean(stored.repoOwner && stored.repoName && stored.githubToken),
      username: stored.leetcodeUsername || "",
      repoOwner: stored.repoOwner || "",
      repoName: stored.repoName || "",
      githubToken: stored.githubToken || "",
      syncMode: "automatic",
    });
  }

  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
  return settings;
}

async function getSettings() {
  return migrateLegacySettings();
}

function normalizeUsername(value) {
  return (value || "").trim().toLowerCase();
}

function normalizeWhitespace(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function sanitizeSlug(value) {
  return (value || "problem")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeTopic(value) {
  return sanitizeSlug(value || "misc") || "misc";
}

function normalizeDifficulty(value) {
  const difficulty = (value || "unknown").toString().trim().toLowerCase();
  if (["easy", "medium", "hard"].includes(difficulty)) {
    return difficulty;
  }
  return "unknown";
}

function pickPrimaryTopic(topics = []) {
  const normalizedTopics = topics.map(normalizeTopic).filter(Boolean);
  if (!normalizedTopics.length) return "misc";

  const topicSet = new Set(normalizedTopics);
  for (const topic of TOPIC_PRIORITY) {
    if (topicSet.has(topic)) return topic;
  }
  return normalizedTopics[0];
}

function buildProfileUrl(platform, username) {
  if (!username) return "";
  const routes = {
    leetcode: `https://leetcode.com/u/${username}/`,
    codeforces: `https://codeforces.com/profile/${username}`,
    codechef: `https://www.codechef.com/users/${username}`,
    hackerrank: `https://www.hackerrank.com/profile/${username}`,
    hackerearth: `https://www.hackerearth.com/@${username}`,
    geeksforgeeks: `https://auth.geeksforgeeks.org/user/${username}/`,
  };
  return routes[platform] || "";
}

function analyzeCode(code, topics = []) {
  const topicText = topics.join(" ").toLowerCase();
  let match = null;

  if (topicText.includes("dynamic-programming") || topicText.includes("dp")) {
    match = {
      algorithm: "Dynamic programming",
      strategy: "dp",
      timeComplexity: "O(n * m)",
      spaceComplexity: "O(n * m)",
      confidence: 0.9,
    };
  } else if (topicText.includes("graph") && topicText.includes("bfs")) {
    match = {
      algorithm: "Breadth-first search",
      strategy: "bfs",
      timeComplexity: "O(V + E)",
      spaceComplexity: "O(V)",
      confidence: 0.88,
    };
  }

  if (!match) {
    for (const rule of ANALYSIS_RULES) {
      if (rule.pattern.test(code)) {
        match = { ...rule };
        break;
      }
    }
  }

  if (!match) {
    match = {
      algorithm: "Iterative solution",
      strategy: topics[0] || "general",
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      confidence: 0.35,
    };
  }

  if (
    match.algorithm === "Dynamic programming" &&
    /dp\s*=\s*\[|vector<\w+>\s+dp\(|int\s+dp\[/i.test(code) &&
    !/vector<vector|dp\s*\[[^\]]+\]\s*\[|dp\s*=\s*\[\s*\[/i.test(code)
  ) {
    match.timeComplexity = "O(n)";
    match.spaceComplexity = "O(n)";
  }

  return {
    algorithm: match.algorithm,
    pattern: match.strategy,
    timeComplexity: match.timeComplexity,
    spaceComplexity: match.spaceComplexity,
    approachSummary: generateApproachSummary(match.algorithm, topics),
    confidence: match.confidence,
  };
}

function generateApproachSummary(algorithm, topics = []) {
  const topicFragment = topics.length ? ` It aligns with ${topics.join(", ")} topics.` : "";
  const summaries = {
    "Dynamic programming":
      "Builds reusable state transitions to avoid recomputing overlapping subproblems.",
    "Breadth-first search":
      "Explores states layer by layer to guarantee shortest-step discovery when applicable.",
    "Depth-first search":
      "Explores recursively or with an explicit stack to cover each reachable branch.",
    "Binary search":
      "Shrinks the answer space by repeatedly testing a midpoint condition.",
    "Two pointers":
      "Moves coordinated indices through the input to avoid unnecessary nested scans.",
    "Sliding window":
      "Maintains a valid moving range while expanding and contracting only when needed.",
    "Hash map":
      "Uses constant-time lookups to remember previously seen values or frequencies.",
    Sorting:
      "Reorders data first so later comparisons or greedy choices become straightforward.",
    Stack:
      "Uses last-in-first-out state to preserve structural or monotonic ordering.",
    Heap:
      "Keeps priority-ordered candidates available without sorting the full dataset.",
    "Union find":
      "Maintains connected components efficiently with repeated merge and lookup operations.",
    Trie:
      "Stores prefixes explicitly for fast lookup over many related strings.",
    Backtracking:
      "Enumerates candidate decisions and prunes branches that cannot produce a valid result.",
    "Bit manipulation":
      "Works directly on binary representation to compress state and speed up operations.",
    "Nested iteration":
      "Checks combinations directly when no stronger pruning or indexing pattern is evident.",
    "Linear scan":
      "Processes the input in a single pass with constant auxiliary state.",
    "Iterative solution":
      "Traverses the input directly with a straightforward loop-based solution.",
  };

  return `${summaries[algorithm] || summaries["Iterative solution"]}${topicFragment}`;
}

function buildNotesContent(data, analysis, primaryTopic) {
  const topics = data.topics?.length ? data.topics.join(", ") : "None detected";
  return `# ${data.title}

- Platform: ${PLATFORM_LABELS[data.platform] || data.platform}
- Problem URL: ${data.problemUrl}
- Difficulty: ${data.difficulty}
- Primary topic: ${primaryTopic}
- Topics: ${topics}
- Language: ${data.lang}
- Detected username: ${data.detectedUsername || "unknown"}

## Understanding

- Algorithm: ${analysis.algorithm}
- Pattern: ${analysis.pattern}
- Time complexity: ${analysis.timeComplexity}
- Space complexity: ${analysis.spaceComplexity}
- Confidence: ${Math.round((analysis.confidence || 0) * 100)}%

## Approach

${analysis.approachSummary}
`;
}

function buildCommitLabel(message) {
  if (message.platform === "leetcode" && message.problemNumber) {
    return `leetcode ${message.problemNumber}`;
  }

  const label = PLATFORM_LABELS[message.platform] || message.platform;
  return `[${label}] ${message.title}`;
}

async function githubRequest(endpoint, method, body, token, extraHeaders = {}) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "If-None-Match": "",
      ...extraHeaders,
    },
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok && response.status !== 404) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(
      `GitHub API error ${response.status}: ${errorBody.message || response.statusText}`
    );
    error.status = response.status;
    throw error;
  }

  if (response.status === 404) return null;
  return response.json();
}

function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function getDefaultBranch(owner, repo, token) {
  const cacheKey = `defaultBranch:${owner}/${repo}`;
  const cached = await chrome.storage.local.get(cacheKey);
  if (cached[cacheKey]) return cached[cacheKey];

  const repoInfo = await githubRequest(`/repos/${owner}/${repo}`, "GET", null, token);
  const branch = repoInfo?.default_branch || "main";
  await chrome.storage.local.set({ [cacheKey]: branch });
  return branch;
}

async function getFile(owner, repo, path, token) {
  return githubRequest(
    `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=HEAD&_=${Date.now()}`,
    "GET",
    null,
    token
  );
}

async function getFileSha(owner, repo, path, token) {
  const file = await getFile(owner, repo, path, token);
  return file?.sha || null;
}

async function createOrUpdateFile(owner, repo, path, content, message, token) {
  const encodedContent = btoa(unescape(encodeURIComponent(content)));

  for (let attempt = 0; attempt < 3; attempt++) {
    const sha = await getFileSha(owner, repo, path, token);
    const body = {
      message,
      content: encodedContent,
      ...(sha ? { sha } : {}),
    };

    try {
      return await githubRequest(
        `/repos/${owner}/${repo}/contents/${encodePath(path)}`,
        "PUT",
        body,
        token
      );
    } catch (error) {
      if (error.status === 409 && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Unable to update ${path}`);
}

async function deleteFile(owner, repo, path, message, token) {
  const sha = await getFileSha(owner, repo, path, token);
  if (!sha) return;
  await githubRequest(
    `/repos/${owner}/${repo}/contents/${encodePath(path)}`,
    "DELETE",
    { message, sha },
    token
  );
}

async function findExistingSolutionPaths(owner, repo, slug, token) {
  try {
    const branch = await getDefaultBranch(owner, repo, token);
    const tree = await githubRequest(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1&_=${Date.now()}`,
      "GET",
      null,
      token
    );

    if (!tree?.tree) return [];

    const matches = [];
    const slugLower = slug.toLowerCase();
    for (const item of tree.tree) {
      if (item.type !== "blob") continue;
      const filename = item.path.split("/").pop().toLowerCase();
      if (filename === `${slugLower}.notes.md`) continue;
      if (filename.startsWith(`${slugLower}.`) && !filename.endsWith(".notes.md")) {
        matches.push(item.path);
      }
    }
    return matches;
  } catch (error) {
    console.warn("[Sync] Could not search repo tree:", error.message);
    return [];
  }
}

async function findMatchingExistingSolution(owner, repo, paths, code, token) {
  const normalizedCode = normalizeWhitespace(code);

  for (const path of paths) {
    const existingFile = await getFile(owner, repo, path, token);
    if (!existingFile?.content) continue;

    const existingContent = normalizeWhitespace(decodeGitHubContent(existingFile.content));
    if (existingContent === normalizedCode) {
      return {
        path,
        content: existingContent,
      };
    }
  }

  return null;
}

function decodeGitHubContent(content) {
  return decodeURIComponent(escape(atob((content || "").replace(/\n/g, ""))));
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return String(hash >>> 0);
}

function buildReadme(platform, stats, username) {
  const label = PLATFORM_LABELS[platform] || platform;
  const total = (stats.easy || 0) + (stats.medium || 0) + (stats.hard || 0);
  const profileUrl = buildProfileUrl(platform, username);
  const profileLine = profileUrl ? `Profile: [${username}](${profileUrl})` : "";

  return `# ${label} Solutions

Auto-synced from ${label} using CodeSync.

${profileLine}

## Stats

| Difficulty | Solved |
|------------|--------|
| Easy       | ${stats.easy || 0} |
| Medium     | ${stats.medium || 0} |
| Hard       | ${stats.hard || 0} |
| **Total**  | **${total}** |
`;
}

async function recomputeStats(owner, repo, token) {
  const branch = await getDefaultBranch(owner, repo, token);
  const tree = await githubRequest(
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1&_=${Date.now()}`,
    "GET",
    null,
    token
  );

  const stats = { easy: 0, medium: 0, hard: 0 };
  if (!tree?.tree) return stats;

  const seen = new Set();
  for (const item of tree.tree) {
    if (item.type !== "blob") continue;
    const segments = item.path.split("/");
    if (segments.length < 3) continue;

    const filename = segments[segments.length - 1];
    if (filename === "README.md" || filename.endsWith(".notes.md")) continue;

    const difficulty = normalizeDifficulty(segments[segments.length - 2]);
    const slug = filename.replace(/\.[^.]+$/, "");
    const key = `${difficulty}:${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (difficulty !== "unknown") {
      stats[difficulty] = (stats[difficulty] || 0) + 1;
    }
  }

  return stats;
}

async function updateReadme(owner, repo, token, platform, username) {
  const path = "README.md";

  for (let attempt = 0; attempt < 3; attempt++) {
    const stats = await recomputeStats(owner, repo, token);
    const content = buildReadme(platform, stats, username);
    const existing = await getFile(owner, repo, path, token);

    if (existing && decodeGitHubContent(existing.content).trim() === content.trim()) {
      return { skipped: true };
    }

    try {
      return await createOrUpdateFile(
        owner,
        repo,
        path,
        content,
        `docs: update ${PLATFORM_LABELS[platform] || platform} stats`,
        token
      );
    } catch (error) {
      if (error.status === 409 && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unable to update README");
}

async function getSyncedProblems() {
  const local = await chrome.storage.local.get([SYNCED_PROBLEMS_KEY]);
  return local[SYNCED_PROBLEMS_KEY] || {};
}

async function saveSyncedProblems(value) {
  await chrome.storage.local.set({ [SYNCED_PROBLEMS_KEY]: value });
}

async function syncToGitHub(message) {
  const settings = await getSettings();
  const platform = message.platform;
  const config = settings.platforms[platform];

  if (!SUPPORTED_PLATFORMS.includes(platform) || !config?.enabled || !config?.setupComplete) {
    return { success: false, ignored: true, message: "Platform not active." };
  }

  if (normalizeUsername(config.username) !== normalizeUsername(message.detectedUsername)) {
    return { success: false, ignored: true, message: "Username mismatch." };
  }

  const owner = config.repoOwner;
  const repo = config.repoName;
  const token = config.githubToken;

  if (!owner || !repo || !token) {
    throw new Error(`GitHub configuration missing for ${PLATFORM_LABELS[platform] || platform}.`);
  }

  const slug = sanitizeSlug(message.slug || message.title);
  const difficulty = normalizeDifficulty(message.difficulty);
  const topics = (message.topics || []).map(normalizeTopic);
  const primaryTopic = pickPrimaryTopic(topics);
  const solutionPath = `${primaryTopic}/${difficulty}/${slug}.${message.ext}`;
  const localState = await getSyncedProblems();
  const stateKey = `${platform}:${normalizeUsername(config.username)}:${slug}`;
  const contentHash = hashString(normalizeWhitespace(message.code));
  const existingLocal = localState[stateKey];

  if (
    existingLocal &&
    existingLocal.contentHash === contentHash &&
    existingLocal.submissionId &&
    existingLocal.submissionId === message.submissionId
  ) {
    return { success: true, status: "up_to_date", message: "Already up to date" };
  }

  const existingPaths = await findExistingSolutionPaths(owner, repo, slug, token);
  let targetPath = solutionPath;
  const matchingExisting = await findMatchingExistingSolution(
    owner,
    repo,
    existingPaths,
    message.code,
    token
  );

  if (matchingExisting) {
    localState[stateKey] = {
      ...existingLocal,
      platform,
      title: message.title,
      difficulty,
      topic: primaryTopic,
      lang: message.lang,
      path: matchingExisting.path,
      syncedAt: message.submittedAt,
      submissionId: message.submissionId || "",
      contentHash,
      username: config.username,
    };
    await saveSyncedProblems(localState);
    return { success: true, status: "up_to_date", message: "Already up to date" };
  }

  if (existingLocal?.path && existingPaths.includes(existingLocal.path)) {
    targetPath = existingLocal.path;
  } else if (existingPaths.includes(solutionPath)) {
    targetPath = solutionPath;
  } else {
    const matchingExtPath = existingPaths.find((path) => path.endsWith(`.${message.ext}`));
    if (matchingExtPath) {
      targetPath = matchingExtPath;
    } else if (existingPaths[0]) {
      targetPath = existingPaths[0];
    }
  }

  const existingRemote = await getFile(owner, repo, targetPath, token);
  if (existingRemote) {
    const existingContent = normalizeWhitespace(decodeGitHubContent(existingRemote.content));
    if (existingContent === normalizeWhitespace(message.code)) {
      localState[stateKey] = {
        ...existingLocal,
        platform,
        title: message.title,
        difficulty,
        topic: primaryTopic,
        lang: message.lang,
        path: targetPath,
        syncedAt: message.submittedAt,
        submissionId: message.submissionId || "",
        contentHash,
        username: config.username,
      };
      await saveSyncedProblems(localState);
      return { success: true, status: "up_to_date", message: "Already up to date" };
    }
  }

  const commitLabel = buildCommitLabel(message);
  await createOrUpdateFile(
    owner,
    repo,
    targetPath,
    message.code,
    `${commitLabel}: update solution`,
    token
  );

  await updateReadme(owner, repo, token, platform, config.username);

  localState[stateKey] = {
    platform,
    title: message.title,
    difficulty,
    topic: primaryTopic,
    lang: message.lang,
    path: targetPath,
    syncedAt: message.submittedAt,
    submissionId: message.submissionId || "",
    contentHash,
    username: config.username,
  };
  await saveSyncedProblems(localState);

  return { success: true, status: "synced", message: "Synced" };
}

chrome.runtime.onInstalled.addListener(() => {
  migrateLegacySettings().catch((error) => {
    console.warn("[Sync] Migration failed:", error.message);
  });
});

chrome.runtime.onStartup.addListener(() => {
  migrateLegacySettings().catch((error) => {
    console.warn("[Sync] Startup migration failed:", error.message);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "SYNC_TO_GITHUB") return false;

  syncToGitHub(message)
    .then((result) => sendResponse(result))
    .catch((error) => {
      console.error("[Sync] Background sync failed:", error);
      sendResponse({ success: false, error: error.message });
    });

  return true;
});
