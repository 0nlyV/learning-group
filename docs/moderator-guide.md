---
layout: default
title: Moderator guide
permalink: /moderator-guide/
---

# Moderator guide

## Install and open Learning Group

After public approval, install Learning Group from Reddit's App Directory. Installation creates a **Learning Group · Portal** custom post. The subreddit menu command **Open Learning Group Portal** returns to the recorded Portal or recreates it when necessary. Select **Open Portal** from its compact, non-scrolling post preview to enter the complete management view.

The Portal is both a discovery page for participants and a management surface for moderators. It does not record participant progress of its own.

## Create a journey

1. Open the Portal and select **Create new journey**.
2. On the first configuration page, set the Reddit post title, journey label, title, short introduction, description, number of resource links, and number of sessions.
3. Select **Configure learning content**.
4. On the second page, configure each resource, session name, session guidance, reflection prompt, estimated minutes, and closing-section wording.
5. Use **Back** to revise the first page without losing current values, or finish the form to create the journey.

Resource addresses must be complete `http://` or `https://` URLs. Learning Group displays them but does not fetch or inspect their content. The community is responsible for choosing appropriate, lawful material and reviewing external destinations.

Completing the form creates and opens a separate custom post under the signed-in moderator's account. The starter journey is only an editable example; all participant-facing wording can be replaced.

## Manage journeys

Each Portal card offers:

- **Open journey** — visit its post.
- **Edit** — change content while retaining progress for sessions that keep the same position.
- **Use as template** — create a separate editable journey from the existing configuration.
- **Conclude** — move an active journey into the dated concluded collection.
- **Reopen** — return a concluded journey to the active collection.
- **Archive** — permanently retire and lock a journey after a second confirmation.

Concluding is optional and reversible. It does not delete or lock the journey post, remove comments, change its content, or reset participant progress.

Archiving is permanent. An archived journey remains available to open and can be used as the unchanged source for a new template, but its original configuration cannot be edited, concluded, reopened, or restored. The Portal records and displays its archive date. Active journeys are expanded by default; concluded and archived collections are collapsed by default.

Session identifiers are preserved by position during editing. Rewording a session therefore retains existing progress. Reducing the number of sessions prunes progress and counts for removed sessions. Progress updates are race-safe, and later changes to the starter template do not overwrite published journeys. If an associated Reddit post is deleted, the app automatically removes its journey data, progress, counts, and Portal reference.

The archive action uses a low-prominence red outline and requires two-step confirmation. Custom posts include generic fallback text for unsupported clients.

[Return to documentation](./)
