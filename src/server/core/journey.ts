import { redis } from '@devvit/web/server';
import {
  MAX_JOURNEY_RESOURCES,
  MAX_JOURNEY_STAGES,
  starterJourney,
  type Journey,
  type JourneyFinalPage,
  type JourneyResource,
  type JourneyStage,
} from '../../shared/journey';

type StoredJourney = {
  journey: Journey;
  updatedAt: string;
  updatedBy: string;
  concludedAt?: string;
  concludedBy?: string;
};

const journeyKey = (postId: string) => `learning-group:${postId}:journey`;

const getStoredJourney = async (
  postId: string
): Promise<StoredJourney | null> => {
  const raw = await redis.get(journeyKey(postId));
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as Partial<StoredJourney>;
    if (!isJourney(stored.journey)) return null;
    return {
      journey: {
        ...stored.journey,
        resources: stored.journey.resources ?? [],
        finalPage: stored.journey.finalPage ?? starterJourney.finalPage,
      },
      updatedAt:
        typeof stored.updatedAt === 'string'
          ? stored.updatedAt
          : new Date(0).toISOString(),
      updatedBy: typeof stored.updatedBy === 'string' ? stored.updatedBy : '',
      ...(typeof stored.concludedAt === 'string'
        ? { concludedAt: stored.concludedAt }
        : {}),
      ...(typeof stored.concludedBy === 'string'
        ? { concludedBy: stored.concludedBy }
        : {}),
    };
  } catch {
    return null;
  }
};

export const hasJourney = async (postId: string): Promise<boolean> =>
  Boolean(await redis.get(journeyKey(postId)));

const isString = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.length <= maxLength;

const isStage = (value: unknown): value is JourneyStage => {
  if (!value || typeof value !== 'object') return false;
  const stage = value as Partial<JourneyStage>;
  return (
    isString(stage.id, 64) &&
    isString(stage.number, 8) &&
    isString(stage.title, 100) &&
    isString(stage.reading, 500) &&
    isString(stage.prompt, 500) &&
    typeof stage.minutes === 'number' &&
    Number.isInteger(stage.minutes) &&
    stage.minutes >= 1 &&
    stage.minutes <= 240
  );
};

const isWebUrl = (value: unknown): value is string => {
  if (!isString(value, 2048)) return false;
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
};

const isResource = (value: unknown): value is JourneyResource => {
  if (!value || typeof value !== 'object') return false;
  const resource = value as Partial<JourneyResource>;
  return (
    isString(resource.id, 64) &&
    isString(resource.title, 100) &&
    isWebUrl(resource.url)
  );
};

const isFinalPage = (value: unknown): value is JourneyFinalPage => {
  if (!value || typeof value !== 'object') return false;
  const finalPage = value as Partial<JourneyFinalPage>;
  return (
    isString(finalPage.label, 80) &&
    isString(finalPage.pendingTitle, 140) &&
    isString(finalPage.pendingDescription, 600) &&
    isString(finalPage.completedTitle, 140) &&
    isString(finalPage.completedDescription, 600)
  );
};

const isJourney = (value: unknown): value is Journey => {
  if (!value || typeof value !== 'object') return false;
  const journey = value as Partial<Journey>;
  const resources = journey.resources ?? [];
  const finalPage = journey.finalPage ?? starterJourney.finalPage;
  return (
    isString(journey.label, 80) &&
    isString(journey.title, 120) &&
    isString(journey.subtitle, 240) &&
    isString(journey.description, 800) &&
    Array.isArray(resources) &&
    resources.length <= MAX_JOURNEY_RESOURCES &&
    resources.every(isResource) &&
    new Set(resources.map((resource) => resource.id)).size ===
      resources.length &&
    isFinalPage(finalPage) &&
    Array.isArray(journey.stages) &&
    journey.stages.length >= 1 &&
    journey.stages.length <= MAX_JOURNEY_STAGES &&
    journey.stages.every(isStage) &&
    new Set(journey.stages.map((stage) => stage.id)).size ===
      journey.stages.length
  );
};

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

export const saveJourney = async ({
  postId,
  journey,
  updatedBy,
}: {
  postId: string;
  journey: Journey;
  updatedBy: string;
}) => {
  if (!isJourney(journey)) {
    throw new Error('The journey did not pass validation.');
  }

  const previous = await getStoredJourney(postId);
  const stored: StoredJourney = {
    journey,
    updatedAt: new Date().toISOString(),
    updatedBy,
    ...(previous?.concludedAt
      ? {
          concludedAt: previous.concludedAt,
          ...(previous.concludedBy
            ? { concludedBy: previous.concludedBy }
            : {}),
        }
      : {}),
  };
  await redis.set(journeyKey(postId), JSON.stringify(stored));
};

export const setJourneyConclusion = async ({
  postId,
  concluded,
  updatedBy,
}: {
  postId: string;
  concluded: boolean;
  updatedBy: string;
}): Promise<string | null> => {
  const stored = await getStoredJourney(postId);
  if (!stored) throw new Error('Learning Group journey not found.');

  if (concluded) {
    const concludedAt = stored.concludedAt ?? new Date().toISOString();
    await redis.set(
      journeyKey(postId),
      JSON.stringify({
        ...stored,
        concludedAt,
        concludedBy: updatedBy,
      } satisfies StoredJourney)
    );
    return concludedAt;
  }

  const {
    concludedAt: _concludedAt,
    concludedBy: _concludedBy,
    ...active
  } = stored;
  await redis.set(journeyKey(postId), JSON.stringify(active));
  return null;
};
