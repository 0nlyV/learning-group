import type { Journey } from './journey';

export const MAX_JOURNEY_ATTRIBUTION_LENGTH = 35_000;

export const journeyAttributionText = (title: string, journey: Journey) =>
  [
    title,
    journey.label,
    journey.title,
    journey.subtitle,
    journey.description,
    ...journey.resources.flatMap((resource) => [resource.title, resource.url]),
    journey.finalPage.label,
    journey.finalPage.pendingTitle,
    journey.finalPage.pendingDescription,
    journey.finalPage.completedTitle,
    journey.finalPage.completedDescription,
    ...journey.stages.flatMap((stage) => [
      stage.title,
      stage.reading,
      stage.prompt,
    ]),
  ].join('\n\n');

export const journeyAttributionFits = (title: string, journey: Journey) =>
  journeyAttributionText(title, journey).length <=
  MAX_JOURNEY_ATTRIBUTION_LENGTH;
