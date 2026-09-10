import { redis } from '@devvit/web/server';
import { starterJourney, type Journey } from '../../shared/journey';
import { isJourney } from '../../shared/journey-validation';

type StoredJourney = {
  journey: Journey;
  updatedAt: string;
  concludedAt?: string;
  archivedAt?: string;
};

const journeyKey = (postId: string) => `learning-group:${postId}:journey`;

const getStoredJourney = async (
  postId: string
): Promise<StoredJourney | null> => {
  const raw = await redis.get(journeyKey(postId));
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as Partial<StoredJourney> &
      Record<string, unknown>;
    if (!isJourney(stored.journey)) return null;
    const normalized: StoredJourney = {
      journey: {
        ...stored.journey,
        resources: stored.journey.resources ?? [],
        finalPage: stored.journey.finalPage ?? starterJourney.finalPage,
      },
      updatedAt:
        typeof stored.updatedAt === 'string'
          ? stored.updatedAt
          : new Date(0).toISOString(),
      ...(typeof stored.concludedAt === 'string'
        ? { concludedAt: stored.concludedAt }
        : {}),
      ...(typeof stored.archivedAt === 'string'
        ? { archivedAt: stored.archivedAt }
        : {}),
    };
    if (
      Object.hasOwn(stored, 'updatedBy') ||
      Object.hasOwn(stored, 'concludedBy') ||
      Object.hasOwn(stored, 'archivedBy')
    ) {
      await redis.set(journeyKey(postId), JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return null;
  }
};

export const hasJourney = async (postId: string): Promise<boolean> =>
  Boolean(await redis.get(journeyKey(postId)));

export const getJourney = async (postId: string): Promise<Journey> => {
  const stored = await getStoredJourney(postId);
  return stored?.journey ?? starterJourney;
};

export const getJourneyConclusion = async (
  postId: string
): Promise<string | null> => {
  const stored = await getStoredJourney(postId);
  return stored?.concludedAt ?? null;
};

export const getJourneyArchive = async (
  postId: string
): Promise<string | null> => {
  const stored = await getStoredJourney(postId);
  return stored?.archivedAt ?? null;
};

export const saveJourney = async ({
  postId,
  journey,
}: {
  postId: string;
  journey: Journey;
}) => {
  if (!isJourney(journey)) {
    throw new Error('The journey did not pass validation.');
  }

  const previous = await getStoredJourney(postId);
  if (previous?.archivedAt) {
    throw new Error('Archived journeys cannot be modified.');
  }
  const stored: StoredJourney = {
    journey,
    updatedAt: new Date().toISOString(),
    ...(previous?.concludedAt ? { concludedAt: previous.concludedAt } : {}),
  };
  await redis.set(journeyKey(postId), JSON.stringify(stored));
};

export const setJourneyConclusion = async ({
  postId,
  concluded,
}: {
  postId: string;
  concluded: boolean;
}): Promise<string | null> => {
  const stored = await getStoredJourney(postId);
  if (!stored) throw new Error('Learning Group journey not found.');
  if (stored.archivedAt) {
    throw new Error('Archived journeys cannot be modified.');
  }

  if (concluded) {
    const concludedAt = stored.concludedAt ?? new Date().toISOString();
    await redis.set(
      journeyKey(postId),
      JSON.stringify({
        ...stored,
        concludedAt,
      } satisfies StoredJourney)
    );
    return concludedAt;
  }

  const { concludedAt: _concludedAt, ...active } = stored;
  await redis.set(journeyKey(postId), JSON.stringify(active));
  return null;
};

export const setJourneyArchive = async ({
  postId,
}: {
  postId: string;
}): Promise<string> => {
  const stored = await getStoredJourney(postId);
  if (!stored) throw new Error('Learning Group journey not found.');

  const archivedAt = stored.archivedAt ?? new Date().toISOString();
  await redis.set(
    journeyKey(postId),
    JSON.stringify({
      ...stored,
      archivedAt,
    } satisfies StoredJourney)
  );
  return archivedAt;
};

export const deleteJourney = async (postId: string): Promise<void> => {
  await redis.del(journeyKey(postId));
};
