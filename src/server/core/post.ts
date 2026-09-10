import { EntrypointHeight, reddit } from '@devvit/web/server';
import { starterJourney, type Journey } from '../../shared/journey';

export const HUB_POST_TITLE = 'Learning Group · Portal';
export const HUB_POST_KIND = 'learning-group-portal';

const postStyles = {
  backgroundColor: '#F4F0E7FF',
  backgroundColorDark: '#131915FF',
  height: EntrypointHeight.TALL,
};

const journeyAttributionText = (title: string, journey: Journey) =>
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

export const createPost = async ({
  title = 'Learning Group · A community learning journey',
  journey = starterJourney,
  runAsUser = false,
}: {
  title?: string;
  journey?: Journey;
  runAsUser?: boolean;
} = {}) => {
  return await reddit.submitCustomPost({
    title,
    entry: 'default',
    styles: postStyles,
    ...(runAsUser
      ? {
          runAs: 'USER' as const,
          userGeneratedContent: {
            text: journeyAttributionText(title, journey),
          },
        }
      : {}),
  });
};

export const createHubPost = async (subredditName: string) =>
  await reddit.submitCustomPost({
    subredditName,
    title: HUB_POST_TITLE,
    entry: 'hub',
    runAs: 'APP',
    sendreplies: false,
    postData: {
      kind: HUB_POST_KIND,
      schemaVersion: 1,
    },
    textFallback: {
      text: 'Open the Learning Group Portal to find community learning journeys or create a new one.',
    },
    styles: postStyles,
  });
