import { redis } from '@devvit/web/server';
import {
  adjustedCompletionCount,
  nextCompletedStageIds,
  parseCompletedStageIds,
} from '../../shared/progress-state';

const MAX_TRANSACTION_ATTEMPTS = 5;

const progressKey = (postId: string) => `learning-group:${postId}:progress`;
const participantsKey = (postId: string) =>
  `learning-group:${postId}:participants`;
const countsKey = (postId: string) => `learning-group:${postId}:stage-counts`;

export const getCompletedStages = async (
  postId: string,
  username: string,
  activeStageIds?: ReadonlySet<string>
): Promise<string[]> =>
  parseCompletedStageIds(
    await redis.hGet(progressKey(postId), username),
    activeStageIds
  );

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
        Math.max(0, Number.parseInt(count, 10) || 0),
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
  const userProgressKey = progressKey(postId);
  const communityParticipantsKey = participantsKey(postId);
  const stageCountsKey = countsKey(postId);

  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    const transaction = await redis.watch(
      userProgressKey,
      communityParticipantsKey,
      stageCountsKey
    );
    const [rawProgress, rawCount] = await Promise.all([
      redis.hGet(userProgressKey, username),
      redis.hGet(stageCountsKey, stageId),
    ]);
    const completed = parseCompletedStageIds(rawProgress, activeStageIds);
    const wasComplete = completed.includes(stageId);

    if (wasComplete === complete) {
      await transaction.unwatch();
      const community = await getCommunityProgress(postId);
      return { completedStageIds: completed, ...community };
    }

    const nextCompleted = nextCompletedStageIds(completed, stageId, complete);
    const nextCount = adjustedCompletionCount(rawCount, complete ? 1 : -1);

    await transaction.multi();
    await transaction.hSet(userProgressKey, {
      [username]: JSON.stringify(nextCompleted),
    });
    await transaction.hSet(communityParticipantsKey, { [username]: '1' });
    if (nextCount === 0) {
      await transaction.hDel(stageCountsKey, [stageId]);
    } else {
      await transaction.hSet(stageCountsKey, {
        [stageId]: String(nextCount),
      });
    }
    const result = await transaction.exec();
    if (result.length === 3) {
      const community = await getCommunityProgress(postId);
      return { completedStageIds: nextCompleted, ...community };
    }
  }

  throw new Error('Progress changed too quickly. Please try again.');
};

export const resetUserProgress = async (postId: string, username: string) => {
  const userProgressKey = progressKey(postId);
  const communityParticipantsKey = participantsKey(postId);
  const stageCountsKey = countsKey(postId);

  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    const transaction = await redis.watch(
      userProgressKey,
      communityParticipantsKey,
      stageCountsKey
    );
    const [rawProgress, participant] = await Promise.all([
      redis.hGet(userProgressKey, username),
      redis.hGet(communityParticipantsKey, username),
    ]);
    const completed = parseCompletedStageIds(rawProgress);

    if (!rawProgress && !participant) {
      await transaction.unwatch();
      return getCommunityProgress(postId);
    }

    const rawCounts = completed.length
      ? await redis.hMGet(stageCountsKey, completed)
      : [];
    await transaction.multi();
    await transaction.hDel(userProgressKey, [username]);
    await transaction.hDel(communityParticipantsKey, [username]);
    for (let index = 0; index < completed.length; index += 1) {
      const stageId = completed[index]!;
      const nextCount = adjustedCompletionCount(
        rawCounts[index] ?? undefined,
        -1
      );
      if (nextCount === 0) {
        await transaction.hDel(stageCountsKey, [stageId]);
      } else {
        await transaction.hSet(stageCountsKey, {
          [stageId]: String(nextCount),
        });
      }
    }
    const expectedResults = 2 + completed.length;
    const result = await transaction.exec();
    if (result.length === expectedResults) return getCommunityProgress(postId);
  }

  throw new Error('Progress changed too quickly. Please try again.');
};

export const pruneInactiveStageData = async (
  postId: string,
  activeStageIds: ReadonlySet<string>
): Promise<void> => {
  const userProgressKey = progressKey(postId);
  const stageCountsKey = countsKey(postId);

  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    const transaction = await redis.watch(userProgressKey, stageCountsKey);
    const [allProgress, allCounts] = await Promise.all([
      redis.hGetAll(userProgressKey),
      redis.hGetAll(stageCountsKey),
    ]);
    const changedProgress = Object.fromEntries(
      Object.entries(allProgress).flatMap(([username, raw]) => {
        const filtered = parseCompletedStageIds(raw, activeStageIds);
        const normalized = JSON.stringify(filtered);
        return normalized === raw ? [] : [[username, normalized]];
      })
    );
    const inactiveCountIds = Object.keys(allCounts).filter(
      (stageId) => !activeStageIds.has(stageId)
    );
    const hasProgressChanges = Object.keys(changedProgress).length > 0;

    if (!hasProgressChanges && inactiveCountIds.length === 0) {
      await transaction.unwatch();
      return;
    }

    await transaction.multi();
    let expectedResults = 0;
    if (hasProgressChanges) {
      await transaction.hSet(userProgressKey, changedProgress);
      expectedResults += 1;
    }
    if (inactiveCountIds.length) {
      await transaction.hDel(stageCountsKey, inactiveCountIds);
      expectedResults += 1;
    }
    const result = await transaction.exec();
    if (result.length === expectedResults) return;
  }

  throw new Error('Progress changed too quickly to finish the journey edit.');
};

export const deleteJourneyProgress = async (postId: string): Promise<void> => {
  await redis.del(
    progressKey(postId),
    participantsKey(postId),
    countsKey(postId)
  );
};
