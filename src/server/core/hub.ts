import { reddit, redis, type Post } from '@devvit/web/server';
import type { HubJourneySummary } from '../../shared/api';
import {
  getJourney,
  getJourneyArchive,
  getJourneyConclusion,
  hasJourney,
} from './journey';
import { createHubPost, HUB_POST_KIND, HUB_POST_TITLE } from './post';
import { getCommunityProgress } from './progress';

const hubPostKey = 'learning-group:portal-post-id';

const postBelongsToHub = async (post: Post, subredditName: string) => {
  if (
    post.removed ||
    post.subredditName.toLowerCase() !== subredditName.toLowerCase()
  )
    return false;

  try {
    const postData = await post.getPostData();
    return postData?.kind === HUB_POST_KIND;
  } catch {
    return false;
  }
};

const findExistingHubPost = async (subredditName: string) => {
  const posts = await reddit.getNewPosts({ subredditName, limit: 100 }).all();
  for (const post of posts) {
    if (
      post.title === HUB_POST_TITLE &&
      (await postBelongsToHub(post, subredditName))
    )
      return post;
  }
  return null;
};

export const ensureHubPost = async (subredditName: string) => {
  const recordedPostId = await redis.get(hubPostKey);
  if (recordedPostId?.startsWith('t3_')) {
    try {
      const recordedPost = await reddit.getPostById(
        recordedPostId as `t3_${string}`
      );
      if (
        recordedPost.title === HUB_POST_TITLE &&
        (await postBelongsToHub(recordedPost, subredditName))
      ) {
        return recordedPostId;
      }
    } catch {
      // Continue below to recover a missing or inaccessible Portal post.
    }
  }

  const existingPost = await findExistingHubPost(subredditName);
  if (existingPost) {
    await redis.set(hubPostKey, existingPost.id);
    return existingPost.id;
  }

  const hubPost = await createHubPost(subredditName);
  await redis.set(hubPostKey, hubPost.id);
  return hubPost.id;
};

export const getHubPostUrl = (subredditName: string, postId: string) =>
  `https://www.reddit.com/r/${encodeURIComponent(subredditName)}/comments/${postId.replace(/^t3_/, '')}`;

export const isHubPost = async (postId: string) =>
  (await redis.get(hubPostKey)) === postId;

export const clearHubPostReference = async (postId: string): Promise<void> => {
  const transaction = await redis.watch(hubPostKey);
  if ((await redis.get(hubPostKey)) !== postId) {
    await transaction.unwatch();
    return;
  }
  await transaction.multi();
  await transaction.del(hubPostKey);
  await transaction.exec();
};

export const getRecentJourneySummaries = async (
  subredditName: string,
  limit = 8
): Promise<HubJourneySummary[]> => {
  let posts: Post[];
  try {
    posts = await reddit.getNewPosts({ subredditName, limit: 100 }).all();
  } catch (error) {
    console.error('Unable to load recent Learning Group posts', error);
    return [];
  }

  const summaries = await Promise.allSettled(
    posts.map(async (post): Promise<HubJourneySummary | null> => {
      if (post.removed || !(await hasJourney(post.id))) return null;
      const [journey, community, concludedAt, archivedAt] = await Promise.all([
        getJourney(post.id),
        getCommunityProgress(post.id),
        getJourneyConclusion(post.id),
        getJourneyArchive(post.id),
      ]);
      return {
        postId: post.id,
        postTitle: post.title,
        postUrl: `https://www.reddit.com${post.permalink}`,
        createdAt: post.createdAt.toISOString(),
        concludedAt,
        archivedAt,
        label: journey.label,
        title: journey.title,
        subtitle: journey.subtitle,
        sessionCount: journey.stages.length,
        participantCount: community.participantCount,
      };
    })
  );

  const available = summaries.flatMap((result) =>
    result.status === 'fulfilled' && result.value ? [result.value] : []
  );
  const active = available
    .filter((journey) => !journey.concludedAt && !journey.archivedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  const concluded = available
    .filter((journey) => journey.concludedAt && !journey.archivedAt)
    .sort((a, b) => (b.concludedAt ?? '').localeCompare(a.concludedAt ?? ''))
    .slice(0, limit);

  const archived = available
    .filter((journey) => journey.archivedAt)
    .sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''))
    .slice(0, limit);

  return [...active, ...concluded, ...archived];
};
