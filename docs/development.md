---
layout: default
title: Development guide
permalink: /development/
---

# Development guide

## Requirements

- Node.js 24.18 or later
- pnpm
- A Reddit account enrolled in the Developer Platform
- A small test subreddit that you moderate

## Local setup

```sh
pnpm install
pnpm run test:types
pnpm run lint
pnpm run build
```

Authenticate with `npx devvit login`, then use `npx devvit playtest r/your_test_subreddit` for Reddit integration testing.

The current lint configuration reports Fast Refresh warnings for the three HTML entry-point modules. They are non-blocking and do not affect production builds.

## Release checks

Before uploading a version:

1. Run formatting, type-checking, lint, and the production build.
2. Test moderator and ordinary-participant paths.
3. Review changes to requested permissions, stored data, and external links.
4. Update the version and [changelog](https://github.com/0nlyV/learning-group/blob/main/CHANGELOG.md).
5. Use `npx devvit upload --version X.Y.Z` for a private test version.
6. Explicitly upgrade the test installation and confirm its installed version.
7. Use `npx devvit publish --public --version X.Y.Z` only when ready to request public App Directory review.

Existing subreddit installations remain on their installed version until a moderator upgrades them.

[Contributing](https://github.com/0nlyV/learning-group/blob/main/CONTRIBUTING.md) · [Return to documentation](./)
