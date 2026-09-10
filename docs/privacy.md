---
layout: default
title: Privacy Policy
permalink: /privacy/
---

# Learning Group Privacy Policy

**Effective date: 10 September 2026**

This policy explains how the independent Learning Group app processes information when installed and used on Reddit. Learning Group operates entirely through Reddit's Developer Platform and Reddit-hosted Devvit services.

## Information processed

Learning Group processes the signed-in Reddit username and the current post and subreddit context supplied by Reddit. It stores:

- Moderator-authored journey content, including titles, descriptions, resource URLs, sessions, prompts, estimated times, and closing wording.
- Moderator lifecycle timestamps for updates, conclusions, and permanent archives. Moderator usernames are not retained.
- Each participant's completed session identifiers, keyed by Reddit username and journey post.
- Aggregate participant and per-session completion counts.
- The current Learning Group Portal post reference.

Learning Group does not ask for or intentionally collect passwords, email addresses, real names, religious affiliation, precise location, payment information, learning notes, or individual completion timestamps.

## How information is used

This information is used only to:

- Restore a participant's progress for a particular journey.
- Calculate personal and aggregate completion displays.
- Apply confirmed participant progress resets and prune progress when sessions are removed during an edit.
- Let moderators create and manage learning journeys.
- Locate the Portal and group active, concluded, and archived journeys.
- Protect moderator-only operations.

Learning Group does not sell information, create advertising profiles, infer beliefs or personal characteristics, or use external analytics.

## Visibility and sharing

A participant can see their own progress. Participants and moderators can see aggregate participation and per-session completion counts. Learning Group does not provide moderators or other participants with a list of which usernames completed a particular session.

Data is processed through Reddit and Devvit. Reddit's own handling of account and platform data is governed by Reddit's policies. Learning Group does not send stored journey or progress data to an independent external server.

## Resource links

Moderators may include external resource URLs. Learning Group displays these URLs but does not fetch, inspect, or track their content. Visiting a link is the participant's choice and is governed by the destination's privacy practices and terms.

## Retention and deletion

Journey, progress, and the Portal post reference are retained in Devvit Redis while needed to restore the experience for their associated Reddit posts and installation. When an associated Reddit post is deleted, Learning Group automatically deletes the journey data, its participant progress and counts, and any Portal reference to that post. The associated lifecycle timestamps are removed with the journey. Reddit or Devvit may also apply platform-level retention and deletion practices.

Participants can remove their own journey progress at any time by choosing **Reset my progress** and then **Confirm reset**. To ask about other Learning Group data associated with your Reddit username, contact [u/EternalZoe](https://www.reddit.com/user/EternalZoe/) and identify the relevant journey post. Account, community, and app-installation deletion may also be subject to Reddit's own platform processes.

## Security

Learning Group limits its use of data to the functions described above and relies on Reddit-hosted authentication and storage. No internet service can guarantee absolute security. Suspected vulnerabilities should be reported privately under the project's [security policy](https://github.com/0nlyV/learning-group/blob/main/SECURITY.md).

## Changes and contact

This policy may be updated when the app's features, permissions, or data practices change. The effective date above will be revised for material updates.

Questions can be sent by private Reddit message to [u/EternalZoe](https://www.reddit.com/user/EternalZoe/).

[Return to documentation](./)
