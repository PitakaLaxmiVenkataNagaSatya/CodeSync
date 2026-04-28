# CodeSync

CodeSync is a Chrome extension that syncs accepted LeetCode solutions to a GitHub repository chosen by the user.

## What It Does

- Works on LeetCode problem pages.
- Detects accepted submissions after a real submit.
- Supports `manual` and `automatic` sync modes.
- Verifies the logged-in LeetCode username before syncing.
- Avoids duplicate pushes when the same solution already exists.
- Updates the target repository with the solution file and a top-level `README.md`.

## Current Scope

CodeSync is currently focused on LeetCode.

## How It Works

1. The user configures:
   - LeetCode username
   - GitHub owner or org
   - GitHub repository name
   - GitHub token
   - sync mode
2. The user submits a solution on LeetCode.
3. After the solution is accepted:
   - `manual` mode shows a `Sync to GitHub` button
   - `automatic` mode syncs directly
4. If the logged-in LeetCode account does not match the configured username, CodeSync stays neutral and does nothing.

## Install Locally

1. Open `chrome://extensions/`.
2. Turn on `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder.

## GitHub Token

Use a GitHub token that has access only to the repository you want CodeSync to update.

Recommended GitHub setup:

1. Create or choose a repository for your LeetCode solutions.
2. Create a fine-grained personal access token.
3. Limit it to that exact repository.
4. Give it `Contents: Read and write`.

## Project Files

- [SETUP.md](/C:/github-leetSub-automater/SETUP.md:1)
  Setup and day-to-day usage.
- [PRIVACY_POLICY.md](/C:/github-leetSub-automater/PRIVACY_POLICY.md:1)
  Privacy and data-handling summary.
- [SUPPORT.md](/C:/github-leetSub-automater/SUPPORT.md:1)
  Troubleshooting and support notes.
- [STORE_LISTING.md](/C:/github-leetSub-automater/STORE_LISTING.md:1)
  Draft Chrome Web Store listing copy.
- [CHROME_WEB_STORE_REVIEW.md](/C:/github-leetSub-automater/CHROME_WEB_STORE_REVIEW.md:1)
  Reviewer notes and test flow.

## Notes

- Manual is the default sync mode.
- CodeSync does not use a separate backend.
- Settings and sync state are stored in extension storage.
- The configured GitHub token is used only to access the repository selected by the user.
