import { context, reddit } from '@devvit/web/server';
import { Hono } from 'hono';
import type {
  HubInitResponse,
  InitResponse,
  JourneyEditorDetailsResponse,
  JourneyEditorErrorResponse,
  JourneyEditorOperation,
  JourneyEditorSaveResponse,
  JourneyEditorStartResponse,
  JourneyStatusRequest,
  JourneyStatusResponse,
  ProgressRequest,
  ProgressResponse,
} from '../../shared/api';
import { starterJourney } from '../../shared/journey';
import {
  journeyDetailsForm,
  journeySessionsForm,
  parseJourneyDetails,
  parseJourneySessions,
} from '../core/forms';
import { getRecentJourneySummaries, isHubPost } from '../core/hub';
import {
  getJourney,
  hasJourney,
  saveJourney,
  setJourneyConclusion,
} from '../core/journey';
import { getModeratorContext } from '../core/moderator';
import { createPost, HUB_POST_KIND } from '../core/post';
import {
  getCommunityProgress,
  getCompletedStages,
  setStageProgress,
} from '../core/progress';

type ErrorResponse = { status: 'error'; message: string };

type EditorRequest = {
  operation?: JourneyEditorOperation;
  sourcePostId?: string;
  input?: Record<string, unknown>;
  detailsInput?: Record<string, unknown>;
  sessionsInput?: Record<string, unknown>;
};

const requestIsForHub = () =>
  (context.postData as { kind?: unknown } | undefined)?.kind === HUB_POST_KIND;

const editorContext = async (
  operation: JourneyEditorOperation,
  requestedSourcePostId?: string
) => {
  const moderator = await getModeratorContext();
  const currentPostId = context.postId;
  if (!moderator || !currentPostId) return null;

  if (requestedSourcePostId && !requestedSourcePostId.startsWith('t3_'))
    return null;

  const sourcePostId = (requestedSourcePostId ?? currentPostId) as
    `t3_${string}` | undefined;
  if (sourcePostId && (await hasJourney(sourcePostId))) {
    const sourcePost = await reddit.getPostById(sourcePostId);
    if (
      sourcePost.subredditName.toLowerCase() !==
      moderator.subredditName.toLowerCase()
    )
      return null;

    return {
      moderator,
      sourcePost,
      sourcePostId,
      journey: await getJourney(sourcePostId),
    };
  }

  if (
    operation === 'create' &&
    !requestedSourcePostId &&
    (requestIsForHub() || (await isHubPost(currentPostId).catch(() => false)))
  ) {
    return {
      moderator,
      sourcePost: null,
      sourcePostId: undefined,
      journey: starterJourney,
    };
  }

  return null;
};

const templatePostTitle = (title: string) => `Copy of ${title}`.slice(0, 300);
const defaultPostTitle = 'Learning Group · A community learning journey';

export const api = new Hono();

api.get('/init', async (c) => {
  const postId = context.postId;
  const username = context.username;
  const subredditName = context.subredditName;

  if (!postId || !username || !subredditName) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'A signed-in Reddit session is required.' },
      400
    );
  }

  const journey = await getJourney(postId).catch((error) => {
    console.error('Unable to load saved journey; using starter journey', error);
    return starterJourney;
  });
  const activeStageIds = new Set(journey.stages.map((stage) => stage.id));
  const [completedStageIds, community] = await Promise.all([
    getCompletedStages(postId, username, activeStageIds).catch((error) => {
      console.error('Unable to load participant progress', error);
      return [];
    }),
    getCommunityProgress(postId).catch((error) => {
      console.error('Unable to load community progress', error);
      return {
        participantCount: 0,
        completionCounts: {} as Record<string, number>,
      };
    }),
  ]);
  const completionCounts = Object.fromEntries(
    journey.stages.map((stage) => [
      stage.id,
      community.completionCounts[stage.id] ?? 0,
    ])
  );

  return c.json<InitResponse>({
    type: 'init',
    username,
    subredditName,
    journey,
    postUrl: `https://www.reddit.com/r/${encodeURIComponent(subredditName)}/comments/${postId.slice(3)}`,
    completedStageIds,
    participantCount: community.participantCount,
    completionCounts,
  });
});

api.get('/hub/init', async (c) => {
  const postId = context.postId;
  const subredditName = context.subredditName;
  const hubPost =
    Boolean(postId) &&
    (requestIsForHub() || (await isHubPost(postId!).catch(() => false)));
  if (!postId || !subredditName || !hubPost) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Learning Group Portal not found.' },
      404
    );
  }

  const [moderator, journeys] = await Promise.all([
    getModeratorContext().catch(() => null),
    getRecentJourneySummaries(subredditName),
  ]);
  return c.json<HubInitResponse>({
    type: 'hub',
    subredditName,
    isModerator: Boolean(moderator),
    journeys,
  });
});

api.post('/hub/journey-status', async (c) => {
  const body = await c.req.json<Partial<JourneyStatusRequest>>();
  if (
    typeof body.postId !== 'string' ||
    !body.postId.startsWith('t3_') ||
    typeof body.concluded !== 'boolean'
  ) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'A valid journey status is required.' },
      400
    );
  }

  const editor = await editorContext('edit', body.postId);
  if (!editor) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Moderator access is required.' },
      403
    );
  }

  const concludedAt = await setJourneyConclusion({
    postId: body.postId,
    concluded: body.concluded,
    updatedBy: editor.moderator.username,
  });

  return c.json<JourneyStatusResponse>({
    status: 'ok',
    postId: body.postId,
    concludedAt,
  });
});

api.get('/editor/start', async (c) => {
  const operation = c.req.query('operation') === 'create' ? 'create' : 'edit';
  const editor = await editorContext(operation, c.req.query('sourcePostId'));
  if (!editor) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Moderator access is required.' },
      403
    );
  }

  return c.json<JourneyEditorStartResponse>({
    status: 'ok',
    operation,
    ...(editor.sourcePostId ? { sourcePostId: editor.sourcePostId } : {}),
    detailsForm: journeyDetailsForm({
      operation,
      journey: editor.journey,
      postTitle:
        operation === 'create' && editor.sourcePost
          ? templatePostTitle(editor.sourcePost.title)
          : (editor.sourcePost?.title ?? defaultPostTitle),
    }),
  });
});

api.post('/editor/details', async (c) => {
  const body = await c.req.json<EditorRequest>();
  const operation = body.operation === 'create' ? 'create' : 'edit';
  const editor = await editorContext(operation, body.sourcePostId);
  if (!editor || !body.input) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Moderator access is required.' },
      403
    );
  }

  const details = parseJourneyDetails(body.input, {
    operation,
    postId: operation === 'edit' ? editor.sourcePostId : undefined,
    postTitle:
      operation === 'edit'
        ? (editor.sourcePost?.title ?? defaultPostTitle)
        : defaultPostTitle,
  });
  if (!details.ok) {
    return c.json<JourneyEditorErrorResponse>(
      {
        status: 'error',
        step: 'details',
        message: details.message,
        form: journeyDetailsForm({
          operation,
          journey: editor.journey,
          postTitle:
            operation === 'create' && editor.sourcePost
              ? templatePostTitle(editor.sourcePost.title)
              : (editor.sourcePost?.title ?? defaultPostTitle),
          overrides: body.input,
        }),
      },
      400
    );
  }

  return c.json<JourneyEditorDetailsResponse>({
    status: 'ok',
    detailsForm: journeyDetailsForm({
      operation,
      journey: editor.journey,
      postTitle:
        operation === 'create' && editor.sourcePost
          ? templatePostTitle(editor.sourcePost.title)
          : details.value.postTitle,
      overrides: body.input,
    }),
    sessionsForm: journeySessionsForm(details.value, editor.journey),
  });
});

api.post('/editor/save', async (c) => {
  const body = await c.req.json<EditorRequest>();
  const operation = body.operation === 'create' ? 'create' : 'edit';
  const editor = await editorContext(operation, body.sourcePostId);
  if (!editor || !body.detailsInput || !body.sessionsInput) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Moderator access is required.' },
      403
    );
  }

  const details = parseJourneyDetails(body.detailsInput, {
    operation,
    postId: operation === 'edit' ? editor.sourcePostId : undefined,
    postTitle: editor.sourcePost?.title ?? defaultPostTitle,
  });
  if (!details.ok) {
    return c.json<JourneyEditorErrorResponse>(
      {
        status: 'error',
        step: 'details',
        message: details.message,
        form: journeyDetailsForm({
          operation,
          journey: editor.journey,
          postTitle: editor.sourcePost?.title ?? defaultPostTitle,
          overrides: body.detailsInput,
        }),
      },
      400
    );
  }

  const journey = parseJourneySessions(
    body.sessionsInput,
    details.value,
    editor.journey
  );
  if (!journey.ok) {
    return c.json<JourneyEditorErrorResponse>(
      {
        status: 'error',
        step: 'sessions',
        message: journey.message,
        form: journeySessionsForm(
          details.value,
          editor.journey,
          body.sessionsInput
        ),
      },
      400
    );
  }

  const post =
    operation === 'create'
      ? await createPost({
          title: details.value.postTitle,
          journey: journey.value,
          runAsUser: true,
        })
      : editor.sourcePost;
  if (!post) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Learning Group post not found.' },
      404
    );
  }
  await saveJourney({
    postId: post.id,
    journey: journey.value,
    updatedBy: editor.moderator.username,
  });

  return c.json<JourneyEditorSaveResponse>({
    status: 'ok',
    journey: journey.value,
    postUrl: `https://www.reddit.com${post.permalink}`,
  });
});

api.post('/progress', async (c) => {
  const postId = context.postId;
  const username = await reddit.getCurrentUsername();
  const body = await c.req.json<ProgressRequest>();
  const journey = postId ? await getJourney(postId) : null;
  const activeStageIds = new Set(
    journey?.stages.map((stage) => stage.id) ?? []
  );
  const validStage = activeStageIds.has(body.stageId);

  if (
    !postId ||
    !username ||
    !validStage ||
    typeof body.complete !== 'boolean'
  ) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Invalid progress update.' },
      400
    );
  }

  const progress = await setStageProgress({
    postId,
    username,
    stageId: body.stageId,
    complete: body.complete,
    activeStageIds,
  });

  return c.json<ProgressResponse>({ type: 'progress', ...progress });
});
