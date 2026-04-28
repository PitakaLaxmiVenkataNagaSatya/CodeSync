# CodeSync Privacy Policy

Last updated: April 25, 2026

## Overview

CodeSync is a Chrome extension that helps users sync accepted LeetCode solutions to a GitHub repository selected by the user.

## Information CodeSync Processes

CodeSync processes the following information only to provide the sync feature:

- LeetCode problem metadata, such as title, slug, difficulty, and tags
- solution code visible on the LeetCode problem page
- visible logged-in LeetCode username used to verify the configured account
- GitHub repository owner, repository name, and token entered by the user
- sync preferences such as manual or automatic mode
- local sync state used to avoid duplicate pushes

## How Information Is Used

CodeSync uses this information to:

- detect accepted LeetCode submissions
- verify that the current LeetCode account matches the configured account
- create or update files in the user-selected GitHub repository
- update the repository `README.md`
- prevent duplicate sync operations

## Storage

CodeSync stores settings and sync state in Chrome extension storage, including:

- configured LeetCode username
- GitHub repository owner and repository name
- GitHub token entered by the user
- sync mode
- local sync history used for duplicate prevention

## Network Requests

CodeSync makes requests only to:

- `leetcode.com` to operate on LeetCode problem pages
- `api.github.com` to read and write files in the user-selected GitHub repository

CodeSync does not send user data to any separate CodeSync backend because CodeSync does not use a backend service.

## Data Sharing

CodeSync does not sell user data.

CodeSync shares data only as needed to perform the user-requested sync to GitHub. That includes sending repository updates to GitHub using the token and repository selected by the user.

## User Control

Users control whether CodeSync is configured and whether sync is manual or automatic.

Users can:

- change their settings at any time
- disable sync by changing their settings or removing the extension
- remove the stored token by editing or clearing the extension configuration

## Contact

For support or privacy questions, use the contact details provided with the Chrome Web Store listing or the support documentation included with this project.
