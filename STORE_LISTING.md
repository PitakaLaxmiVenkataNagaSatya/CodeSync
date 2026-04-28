# Chrome Web Store Listing Draft

## Name

CodeSync

## Short Description

Sync accepted LeetCode solutions to your GitHub repository with manual or automatic control.

## Detailed Description

CodeSync helps you sync accepted LeetCode solutions to a GitHub repository that you choose.

Features:

- LeetCode-focused workflow
- manual or automatic sync mode
- username match protection
- duplicate prevention
- repository update with `README.md` stats

How it works:

1. Configure your LeetCode username, GitHub repository, token, and sync mode.
2. Submit a solution on LeetCode.
3. After the submission is accepted:
   - manual mode shows a `Sync to GitHub` button
   - automatic mode syncs directly

CodeSync only syncs for the configured LeetCode username and avoids creating duplicate repository updates when the solution already exists.

## Privacy Disclosure Summary

CodeSync reads accepted solution code, problem metadata, and the visible logged-in LeetCode username in order to sync the solution to the GitHub repository selected by the user.

CodeSync stores configuration and sync state in Chrome extension storage and sends repository updates only to GitHub's API.
