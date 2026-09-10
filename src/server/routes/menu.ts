import type { UiResponse } from '@devvit/web/shared';
import { Hono } from 'hono';
import { ensureHubPost, getHubPostUrl } from '../core/hub';
import { getModeratorContext } from '../core/moderator';

export const menu = new Hono();

menu.post('/hub-open', async (c) => {
  try {
    const moderator = await getModeratorContext();
    if (!moderator) {
      return c.json<UiResponse>(
        {
          showToast: 'Only a subreddit moderator can create a Learning Group.',
        },
        403
      );
    }

    const hubPostId = await ensureHubPost(moderator.subredditName);
    return c.json<UiResponse>({
      showToast: {
        text: 'Create a new journey or manage an existing one in the Portal.',
        appearance: 'neutral',
      },
      navigateTo: getHubPostUrl(moderator.subredditName, hubPostId),
    });
  } catch (error) {
    console.error('Unable to open Learning Group Portal', error);
    return c.json<UiResponse>(
      { showToast: 'Could not open the Learning Group Portal.' },
      400
    );
  }
});
