# Contributing to Learning Group

Thank you for helping make community learning on Reddit more welcoming and useful.

## Before opening an issue

- Search existing issues for the same problem or idea.
- Do not post Reddit usernames, private-community content, authentication data, or screenshots containing personal information.
- Report security or privacy vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Development setup

1. Install Node.js 24.18 or later and pnpm.
2. Clone the repository and run `pnpm install`.
3. Run `pnpm run test:types`, `pnpm run lint`, and `pnpm run build`.
4. Use `npx devvit playtest r/your_test_subreddit` for Reddit integration testing.

Use a small private test subreddit and test both moderator and ordinary-participant accounts. Never use real community data for fixtures or screenshots without permission.

## Pull requests

- Keep each change focused and explain its participant or moderator impact.
- Preserve accessibility, light/dark appearance support, and narrow-screen layouts.
- Update documentation when behaviour, permissions, stored data, or moderator workflows change.
- Include verification steps and note any behaviour that must be tested inside Reddit.
- Run formatting, type-checking, lint, and the production build before requesting review.

By contributing, you agree that your contribution may be distributed under the repository's BSD 3-Clause License.
