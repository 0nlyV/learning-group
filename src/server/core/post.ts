import { EntrypointHeight, reddit } from '@devvit/web/server';
import {
  journeyAttributionFits,
  journeyAttributionText,
} from '../../shared/attribution';
import { starterJourney, type Journey } from '../../shared/journey';

export const HUB_POST_TITLE = 'Learning Group · Portal';
export const HUB_POST_KIND = 'learning-group-portal';

const postStyles = {
  backgroundColor: '#F4F0E7FF',
  backgroundColorDark: '#131915FF',
  height: EntrypointHeight.TALL,
};

export const createPost = async ({
  title = 'Learning Group · A community learning journey',
  journey = starterJourney,
  runAsUser = false,
}: {
  title?: string;
  journey?: Journey;
  runAsUser?: boolean;
} = {}) => {
  if (runAsUser && !journeyAttributionFits(title, journey)) {
    throw new Error(
      'The combined journey content is too long to create a Reddit post.'
    );
  }

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
    textFallback: {
      text: 'Open this Learning Group journey in modern Reddit to follow its sessions, track progress, and join the discussion.',
    },
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
