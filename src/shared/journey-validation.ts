import {
  MAX_JOURNEY_RESOURCES,
  MAX_JOURNEY_STAGES,
  starterJourney,
  type Journey,
  type JourneyFinalPage,
  type JourneyResource,
  type JourneyStage,
} from './journey';

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

export const isJourney = (value: unknown): value is Journey => {
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
