Are you considering to prepare a PR to create a new release?

**Create a new PR, while inside the PR branch:**

- Open package.json, change version number accordingly. (E.g. 1.0.1)
- Run `npm run generate-changelog`.
- Open package.json again, reset number back to previous version. (E.g. 1.0.0)
- Commit and push the two generated files, `CHANGELOG.md` & `src/routes/changelogs/changelogs.html`.

Squash branch into main with commit message `chore: Changelogs for v1.0.1`.

**Switch to main branch:**

- Run `npm version <stuff>`, currently it's `npm version prerelease --preid beta` but eventually stick to patch, minor and major.
- Push generated commit.
- Run `git push origin tag v1.0.1` to publish tag.

Done. 🎉
