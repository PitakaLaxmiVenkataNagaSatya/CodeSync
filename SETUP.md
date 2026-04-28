# CodeSync Setup

CodeSync syncs accepted LeetCode solutions to a GitHub repository that you choose.

## What CodeSync Does

- Runs only on LeetCode problem pages.
- Detects accepted submissions after a real submit.
- Reads the solution code, problem metadata, and visible logged-in LeetCode username.
- Writes the solution and a top-level `README.md` to the GitHub repository you configure.
- Skips syncing when the logged-in LeetCode username does not match the username you saved.

## Install Locally

1. Open `chrome://extensions/`.
2. Turn on `Developer mode`.
3. Click `Load unpacked`.
4. Select this project folder.

## GitHub Token

Use a GitHub token that has access only to the repository you want CodeSync to update.

Recommended setup:

1. Create or choose a repository for LeetCode solutions.
2. Generate a GitHub fine-grained personal access token.
3. Limit it to that exact repository.
4. Give it `Contents: Read and write`.

## Configure CodeSync

Open the extension popup and enter:

- LeetCode username
- GitHub owner or org
- GitHub repository name
- GitHub token
- Sync mode: `manual` or `automatic`

Manual is the default mode.

## Sync Behavior

### Manual

- Submit a solution on LeetCode.
- Wait until the submission is accepted.
- Click the blue `Sync to GitHub` button.

### Automatic

- Submit a solution on LeetCode.
- Wait until the submission is accepted.
- CodeSync syncs automatically.

## Duplicate Protection

CodeSync avoids duplicate pushes by:

- checking whether the same solution already exists in the repository
- reusing an existing matching file if the user already added it manually
- returning `Already up to date` instead of pushing again when nothing changed

## Notes

- CodeSync does not sync on behalf of a different LeetCode account.
- CodeSync is currently focused on LeetCode.
- Settings and the configured token are stored in extension storage.
