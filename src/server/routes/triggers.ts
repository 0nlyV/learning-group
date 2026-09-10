import { context } from '@devvit/web/server';
import type {
  OnAppInstallRequest,
  OnPostDeleteRequest,
  TriggerResponse,
} from '@devvit/web/shared';
import { Hono } from 'hono';
import { clearHubPostReference, ensureHubPost } from '../core/hub';
import { deleteJourney } from '../core/journey';
import { deleteJourneyProgress } from '../core/progress';

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  try {
    const input = await c.req.json<OnAppInstallRequest>();
    const postId = await ensureHubPost(context.subredditName);
    return c.json<TriggerResponse>(
      {
        status: 'success',
        message: `Learning Group Portal is available at ${postId} in ${context.subredditName} (${input.type}).`,
      },
      200
    );
  } catch (error) {
    console.error('Unable to ensure Learning Group Portal', error);
    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: 'Could not create the Learning Group Portal.',
      },
      400
    );
  }
});

triggers.post('/on-post-delete', async (c) => {
  try {
    const input = await c.req.json<OnPostDeleteRequest>();
    if (!input.postId?.startsWith('t3_')) {
      throw new Error('A valid deleted post is required.');
    }
    await Promise.all([
      deleteJourney(input.postId),
      deleteJourneyProgress(input.postId),
      clearHubPostReference(input.postId),
    ]);
    return c.json<TriggerResponse>(
      {
        status: 'success',
        message: `Removed Learning Group data for ${input.postId}.`,
      },
      200
    );
  } catch (error) {
    console.error('Unable to remove data for deleted post', error);
    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: 'Could not remove the deleted post data.',
      },
      400
    );
  }
});
