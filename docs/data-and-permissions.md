---
layout: default
title: Data and permissions
permalink: /data-and-permissions/
---

# Data and permissions

Learning Group uses Reddit and Reddit-hosted Devvit services only. It has no external analytics, advertising network, payment provider, or external account system.

## Stored data

The app stores in Devvit Redis:

- Moderator-authored journey titles, descriptions, resource URLs, sessions, prompts, estimated times, and closing wording.
- The Reddit username of the moderator who last updated a journey.
- An optional conclusion timestamp and the Reddit username of the moderator who concluded it.
- An optional permanent archive timestamp and the Reddit username of the moderator who archived it.
- Each participant's completed session identifiers, keyed by Reddit username and journey post.
- Aggregate participant and per-session completion counts.
- The current Portal post reference.

It does not store learning notes, individual completion timestamps, passwords, email addresses, real names, religious affiliation, precise location, or payment information. Unsaved form values remain in the active Reddit form and are not stored as drafts.

## Visibility

Participants see their own progress and aggregate community totals. Moderators configure content and see the same totals, but Learning Group does not expose a list of the usernames that completed a session.

## Requested capabilities

- **Reddit access** identifies the signed-in participant, verifies moderator access, reads post/community context, and creates custom posts.
- **Submit post as the current user** lets a moderator publish a configured journey under their own Reddit account.
- **Devvit Redis** stores configuration, lifecycle state, Portal reference, progress identifiers, and aggregate counts.
- **Embedded web app access** displays the interactive Portal and journeys.

Reddit's installation model may add the app account as a subreddit moderator. Learning Group does not moderate posts, comments, users, modmail, or community settings.

## External resources

The app displays moderator-provided URLs without fetching, analysing, or tracking them. Choosing to visit a URL leaves the Learning Group experience and is governed by the destination's terms and privacy practices.

See the [Privacy Policy](privacy) for the complete disclosure.

[Return to documentation](./)
