import { context, reddit } from '@devvit/web/server';

export type ModeratorContext = {
  subredditName: string;
  username: string;
};

export const getModeratorContext =
  async (): Promise<ModeratorContext | null> => {
    const subredditName = context.subredditName;
    const username = await reddit.getCurrentUsername();
    if (!subredditName || !username) return null;

    const moderators = await reddit
      .getModerators({ subredditName, username, limit: 1 })
      .all();
    const isModerator = moderators.some(
      (moderator) => moderator.username.toLowerCase() === username.toLowerCase()
    );

    return isModerator ? { subredditName, username } : null;
  };
