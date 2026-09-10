import { context } from '@devvit/web/server';
import type { OnAppInstallRequest, TriggerResponse } from '@devvit/web/shared';
import { Hono } from 'hono';
import { ensureHubPost } from '../core/hub';

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
