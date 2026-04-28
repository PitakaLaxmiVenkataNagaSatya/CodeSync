# CodeSync Reviewer Notes

## Single Purpose

CodeSync has one purpose: sync accepted LeetCode solutions to a GitHub repository chosen by the user.

## Permissions

- `storage`
  Used to store the user's configuration, sync mode, token, and duplicate-prevention state.

## Host Access

- `https://leetcode.com/*`
  Used only to read LeetCode problem-page content needed for accepted-submission sync.

- `https://api.github.com/*`
  Used only to read and write files in the repository selected by the user.

## No Backend

CodeSync does not use a separate backend service. It talks directly to GitHub's API from the extension.

## User-Controlled Behavior

- The user enters the repository details and token.
- The user enters the expected LeetCode username.
- The extension does nothing when the logged-in LeetCode username does not match the configured username.
- In manual mode, the user must click `Sync to GitHub` after an accepted submission.
- In automatic mode, sync happens only after an accepted submission.

## Reviewer Test Flow

1. Load the unpacked extension.
2. Open the popup and enter:
   - LeetCode username
   - GitHub owner
   - repository name
   - GitHub token
   - sync mode
3. Open a LeetCode problem page while logged into the configured LeetCode account.
4. Submit a solution and wait for `Accepted`.
5. Confirm:
   - manual mode shows a sync button only after acceptance
   - automatic mode syncs only after acceptance
   - duplicate sync attempts show `Already up to date`
6. Switch to a different LeetCode account and confirm the extension stays neutral and does not sync.

## Data Handling Summary

CodeSync reads solution code, problem metadata, and the visible LeetCode username only to perform the requested GitHub sync.
