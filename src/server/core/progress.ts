import { redis } from '@devvit/web/server';

const progressKey = (postId: string) => `learning-group:${postId}:progress`;
const participantsKey = (postId: string) =>
  `learning-group:${postId}:participants`;
const countsKey = (postId: string) => `learning-group:${postId}:stage-counts`;

export const getCompletedStages = async (
  postId: string,
  username: string,
  activeStageIds?: ReadonlySet<string>
): Promise<string[]> => {
  const raw = await redis.hGet(progressKey(postId), username);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    const completed = Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
    return activeStageIds
      ? completed.filter((stageId) => activeStageIds.has(stageId))
      : completed;
  } catch {
    return [];
  }
};

export const getCommunityProgress = async (postId: string) => {
  const [participantCount, rawCounts] = await Promise.all([
    redis.hLen(participantsKey(postId)),
    redis.hGetAll(countsKey(postId)),
  ]);

  return {
    participantCount,
    completionCounts: Object.fromEntries(
      Object.entries(rawCounts).map(([stageId, count]) => [
        stageId,
        Number.parseInt(count, 10) || 0,
      ])
    ),
  };
};

export const setStageProgress = async ({
  postId,
  username,
  stageId,
  complete,
  activeStageIds,
}: {
  postId: string;
  username: string;
  stageId: string;
  complete: boolean;
  activeStageIds: ReadonlySet<string>;
}) => {
  const completed = await getCompletedStages(postId, username, activeStageIds);
  const wasComplete = completed.includes(stageId);

  if (wasComplete !== complete) {
    const nextCompleted = complete
      ? [...completed, stageId]
      : completed.filter((id) => id !== stageId);

    await Promise.all([
      redis.hSet(progressKey(postId), {
        [username]: JSON.stringify(nextCompleted),
      }),
      redis.hSet(participantsKey(postId), { [username]: '1' }),
      redis.hIncrBy(countsKey(postId), stageId, complete ? 1 : -1),
    ]);
  }

  const [completedStageIds, community] = await Promise.all([
    getCompletedStages(postId, username, activeStageIds),
    getCommunityProgress(postId),
  ]);

  return { completedStageIds, ...community };
};
