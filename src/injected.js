// injected.js - page-context code access plus LeetCode accepted submission interception

(function () {
  "use strict";

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.type !== "LEETSYNC_GET_CODE") return;

    let code = null;
    try {
      if (window.monaco?.editor) {
        const models = window.monaco.editor.getModels();
        if (models?.length) {
          let best = models[0];
          for (const model of models) {
            if (model.getValue().length > best.getValue().length) best = model;
          }
          code = best.getValue();
        }
      }
    } catch (_) {}

    window.postMessage(
      {
        type: "LEETSYNC_CODE_RESPONSE",
        requestId: event.data.requestId,
        code,
      },
      "*"
    );
  });

  function notifyLeetCodeAccepted(url, data) {
    const submissionId =
      url.match(/\/submissions\/detail\/(\d+)\//)?.[1] || Date.now().toString();
    window.postMessage(
      {
        type: "LEETCODE_ACCEPTED",
        payload: {
          submissionId,
          lang: data.lang || null,
          runtime: data.status_runtime || null,
          memory: data.status_memory || null,
        },
      },
      "*"
    );
  }

  if (!window.location.hostname.includes("leetcode.com")) {
    return;
  }

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      if (url.includes("/submissions/detail/") && url.includes("/check/")) {
        response
          .clone()
          .json()
          .then((data) => {
            if (data.state === "SUCCESS" && data.status_msg === "Accepted") {
              notifyLeetCodeAccepted(url, data);
            }
          })
          .catch(() => {});
      }
    } catch (_) {}

    return response;
  };

  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._leetSyncUrl = url;
    return originalXHROpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", function () {
      try {
        const url = this._leetSyncUrl || "";
        if (url.includes("/submissions/detail/") && url.includes("/check/")) {
          const data = JSON.parse(this.responseText);
          if (data.state === "SUCCESS" && data.status_msg === "Accepted") {
            notifyLeetCodeAccepted(url, data);
          }
        }
      } catch (_) {}
    });
    return originalXHRSend.apply(this, args);
  };
})();
