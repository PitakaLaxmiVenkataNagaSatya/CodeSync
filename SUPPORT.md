# CodeSync Support

## Purpose

CodeSync is a Chrome extension for syncing accepted LeetCode solutions to a GitHub repository selected by the user.

## Common Questions

### The sync button does not appear

Check that:

- you are on a LeetCode problem flow, not an unrelated page
- the configured LeetCode username matches the logged-in username
- the submission was actually accepted
- the extension has been reloaded after recent updates

### Automatic mode did not push

Check that:

- sync mode is set to `automatic`
- the accepted submission happened after a real `Submit`
- the selected GitHub repository and token are correct

### It says `Already up to date`

That means CodeSync found an existing matching solution in the repository or found that nothing changed.

### GitHub sync fails

Check that:

- the token has access to the exact repository
- the token has `Contents: Read and write`
- the repository owner and name are correct

## Contact

Use the support email or contact method listed in the Chrome Web Store listing for this extension.
