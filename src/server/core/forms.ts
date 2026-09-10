import type { Form, FormField } from '@devvit/web/shared';
import { randomUUID } from 'node:crypto';
import {
  MAX_JOURNEY_RESOURCES,
  MAX_JOURNEY_STAGES,
  starterJourney,
  type Journey,
} from '../../shared/journey';

export type JourneyOperation = 'create' | 'edit';

export type JourneyDetails = {
  operation: JourneyOperation;
  postId?: string;
  postTitle: string;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  resourceCount: number;
  sessionCount: number;
};

type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string };

const text = (
  value: unknown,
  label: string,
  maxLength: number
): ParseResult<string> => {
  if (typeof value !== 'string' || !value.trim()) {
    return { ok: false, message: `${label} is required.` };
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    return {
      ok: false,
      message: `${label} must be ${maxLength} characters or fewer.`,
    };
  }
  return { ok: true, value: normalized };
};

const integer = (
  value: unknown,
  label: string,
  min: number,
  max: number
): ParseResult<number> => {
  const normalized = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(normalized) || normalized < min || normalized > max) {
    return {
      ok: false,
      message: `${label} must be a whole number between ${min} and ${max}.`,
    };
  }
  return { ok: true, value: normalized };
};

const stringDefault = (
  overrides: Record<string, unknown>,
  name: string,
  fallback: string
) => (typeof overrides[name] === 'string' ? overrides[name] : fallback);

const numberDefault = (
  overrides: Record<string, unknown>,
  name: string,
  fallback: number
) => (typeof overrides[name] === 'number' ? overrides[name] : fallback);

export const journeyDetailsForm = ({
  operation,
  journey = starterJourney,
  postTitle = 'Learning Group · A community learning journey',
  overrides = {},
}: {
  operation: JourneyOperation;
  journey?: Journey;
  postTitle?: string;
  overrides?: Record<string, unknown>;
}): Form => {
  return {
    title:
      operation === 'create'
        ? 'Create a Learning Group'
        : 'Edit this Learning Group',
    description:
      operation === 'create'
        ? 'Start with editable template values. Every field can be changed before the new post is created.'
        : 'Update the journey details. Existing progress is preserved for sessions that remain in the same position.',
    fields: [
      ...(operation === 'create'
        ? [
            {
              type: 'string' as const,
              name: 'postTitle',
              label: 'Reddit post title',
              required: true,
              defaultValue: stringDefault(overrides, 'postTitle', postTitle),
              helpText:
                'This appears above the Learning Group app in the subreddit.',
            },
          ]
        : []),
      {
        type: 'string',
        name: 'label',
        label: 'Journey label',
        required: true,
        defaultValue: stringDefault(overrides, 'label', journey.label),
        helpText: 'For example: Learning journey, Week 1, or Gospel of John.',
      },
      {
        type: 'string',
        name: 'title',
        label: 'Journey title',
        required: true,
        defaultValue: stringDefault(overrides, 'title', journey.title),
        helpText: 'For example: Learning together, Chapter 1.',
      },
      {
        type: 'string',
        name: 'subtitle',
        label: 'Short introduction',
        required: true,
        defaultValue: stringDefault(overrides, 'subtitle', journey.subtitle),
        helpText: 'Keep it short and concise, displayed on the post cover.',
      },
      {
        type: 'paragraph',
        name: 'description',
        label: 'Journey description',
        required: true,
        defaultValue: stringDefault(
          overrides,
          'description',
          journey.description
        ),
        lineHeight: 4,
        helpText: 'Displayed at the top of the session page.',
      },
      {
        type: 'number',
        name: 'resourceCount',
        label: 'Number of resource links',
        required: true,
        defaultValue: numberDefault(
          overrides,
          'resourceCount',
          journey.resources.length
        ),
        helpText: `Optional. Choose between 0 and ${MAX_JOURNEY_RESOURCES}.`,
      },
      {
        type: 'number',
        name: 'sessionCount',
        label: 'Number of sessions',
        required: true,
        defaultValue: numberDefault(
          overrides,
          'sessionCount',
          journey.stages.length
        ),
        helpText: `Choose between 1 and ${MAX_JOURNEY_STAGES}.`,
      },
    ],
    acceptLabel: 'Configure learning content',
    cancelLabel: 'Cancel',
  };
};

export const parseJourneyDetails = (
  input: Record<string, unknown>,
  {
    operation,
    postId,
    postTitle: existingPostTitle,
  }: {
    operation: JourneyOperation;
    postId?: string;
    postTitle: string;
  }
): ParseResult<JourneyDetails> => {
  const postTitle = text(
    operation === 'create' ? input.postTitle : existingPostTitle,
    'Reddit post title',
    300
  );
  if (!postTitle.ok) return postTitle;
  const label = text(input.label, 'Journey label', 80);
  if (!label.ok) return label;
  const title = text(input.title, 'Journey title', 120);
  if (!title.ok) return title;
  const subtitle = text(input.subtitle, 'Short introduction', 240);
  if (!subtitle.ok) return subtitle;
  const description = text(input.description, 'Journey description', 800);
  if (!description.ok) return description;
  const resourceCount = integer(
    input.resourceCount,
    'Number of resource links',
    0,
    MAX_JOURNEY_RESOURCES
  );
  if (!resourceCount.ok) return resourceCount;
  const sessionCount = integer(
    input.sessionCount,
    'Number of sessions',
    1,
    MAX_JOURNEY_STAGES
  );
  if (!sessionCount.ok) return sessionCount;

  if (operation === 'edit' && (!postId || !postId.startsWith('t3_'))) {
    return {
      ok: false,
      message: 'The Learning Group post could not be identified.',
    };
  }

  return {
    ok: true,
    value: {
      operation,
      ...(postId ? { postId } : {}),
      postTitle: postTitle.value,
      label: label.value,
      title: title.value,
      subtitle: subtitle.value,
      description: description.value,
      resourceCount: resourceCount.value,
      sessionCount: sessionCount.value,
    },
  };
};

const resourceFields = (
  count: number,
  journey: Journey,
  overrides: Record<string, unknown>
): FormField[] =>
  Array.from({ length: count }, (_, index) => {
    const resource = journey.resources[index];
    const field = `resource_${index + 1}`;
    return {
      type: 'group',
      label: `Resource ${index + 1}`,
      fields: [
        {
          type: 'string',
          name: `${field}_title`,
          label: 'Link label',
          required: true,
          defaultValue: stringDefault(
            overrides,
            `${field}_title`,
            resource?.title ?? ''
          ),
          helpText: 'For example: Open the article or Watch the lesson.',
        },
        {
          type: 'string',
          name: `${field}_url`,
          label: 'Web address',
          required: true,
          defaultValue: stringDefault(
            overrides,
            `${field}_url`,
            resource?.url ?? ''
          ),
          helpText: 'Enter a complete http:// or https:// link.',
        },
      ],
    };
  });

const sessionFields = (
  count: number,
  journey: Journey,
  overrides: Record<string, unknown>
): FormField[] =>
  Array.from({ length: count }, (_, index) => {
    const stage = journey.stages[index];
    const field = `stage_${index + 1}`;
    return {
      type: 'group',
      label: `Session ${index + 1}`,
      fields: [
        {
          type: 'string',
          name: `${field}_title`,
          label: 'Session name',
          required: true,
          defaultValue: stringDefault(
            overrides,
            `${field}_title`,
            stage?.title ?? `Session ${index + 1}`
          ),
        },
        {
          type: 'paragraph',
          name: `${field}_reading`,
          label: 'Session guidance',
          required: true,
          defaultValue: stringDefault(
            overrides,
            `${field}_reading`,
            stage?.reading ?? ''
          ),
          lineHeight: 3,
        },
        {
          type: 'paragraph',
          name: `${field}_prompt`,
          label: 'Reflection prompt',
          required: true,
          defaultValue: stringDefault(
            overrides,
            `${field}_prompt`,
            stage?.prompt ?? ''
          ),
          lineHeight: 3,
        },
        {
          type: 'number',
          name: `${field}_minutes`,
          label: 'Estimated minutes',
          required: true,
          defaultValue: numberDefault(
            overrides,
            `${field}_minutes`,
            stage?.minutes ?? 15
          ),
        },
      ],
    };
  });

const finalPageFields = (
  journey: Journey,
  overrides: Record<string, unknown>
): FormField => {
  const finalPage = journey.finalPage ?? starterJourney.finalPage;
  return {
    type: 'group',
    label: 'Closing section',
    fields: [
      {
        type: 'string',
        name: 'finalPageLabel',
        label: 'Section label',
        required: true,
        defaultValue: stringDefault(
          overrides,
          'finalPageLabel',
          finalPage.label
        ),
        helpText: 'For example: The final page or Closing reflection.',
      },
      {
        type: 'string',
        name: 'finalPagePendingTitle',
        label: 'Heading before completion',
        required: true,
        defaultValue: stringDefault(
          overrides,
          'finalPagePendingTitle',
          finalPage.pendingTitle
        ),
      },
      {
        type: 'paragraph',
        name: 'finalPagePendingDescription',
        label: 'Message before completion',
        required: true,
        defaultValue: stringDefault(
          overrides,
          'finalPagePendingDescription',
          finalPage.pendingDescription
        ),
        lineHeight: 3,
      },
      {
        type: 'string',
        name: 'finalPageCompletedTitle',
        label: 'Heading after completion',
        required: true,
        defaultValue: stringDefault(
          overrides,
          'finalPageCompletedTitle',
          finalPage.completedTitle
        ),
      },
      {
        type: 'paragraph',
        name: 'finalPageCompletedDescription',
        label: 'Message after completion',
        required: true,
        defaultValue: stringDefault(
          overrides,
          'finalPageCompletedDescription',
          finalPage.completedDescription
        ),
        lineHeight: 3,
      },
    ],
  };
};

export const journeySessionsForm = (
  details: JourneyDetails,
  journey: Journey,
  overrides: Record<string, unknown> = {}
): Form => ({
  title: `${details.operation === 'create' ? 'Create' : 'Edit'} learning content`,
  description:
    details.operation === 'edit'
      ? 'Update the shared links, sessions, and final page. Changing or removing a session may affect how existing participant progress is understood.'
      : 'Review and modify the template links, sessions, and final-page wording before creating the new journey.',
  fields: [
    ...resourceFields(details.resourceCount, journey, overrides),
    ...sessionFields(details.sessionCount, journey, overrides),
    finalPageFields(journey, overrides),
  ],
  acceptLabel:
    details.operation === 'create' ? 'Create Learning Group' : 'Save changes',
  cancelLabel: 'Back',
});

const webUrl = (value: unknown, label: string): ParseResult<string> => {
  const raw = text(value, label, 2048);
  if (!raw.ok) return raw;

  try {
    const parsed = new URL(raw.value);
    if (
      (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
      parsed.username ||
      parsed.password
    ) {
      throw new Error('Unsupported URL');
    }
    return { ok: true, value: parsed.toString() };
  } catch {
    return {
      ok: false,
      message: `${label} must be a complete http:// or https:// link without embedded credentials.`,
    };
  }
};

export const parseJourneySessions = (
  input: Record<string, unknown>,
  details: JourneyDetails,
  existingJourney: Journey
): ParseResult<Journey> => {
  const resources = [];
  for (let index = 0; index < details.resourceCount; index += 1) {
    const field = `resource_${index + 1}`;
    const title = text(
      input[`${field}_title`],
      `Resource ${index + 1} label`,
      100
    );
    if (!title.ok) return title;
    const url = webUrl(
      input[`${field}_url`],
      `Resource ${index + 1} web address`
    );
    if (!url.ok) return url;

    resources.push({
      id:
        existingJourney.resources[index]?.id ??
        `resource-${index + 1}-${randomUUID().slice(0, 8)}`,
      title: title.value,
      url: url.value,
    });
  }

  const stages = [];
  for (let index = 0; index < details.sessionCount; index += 1) {
    const field = `stage_${index + 1}`;
    const title = text(
      input[`${field}_title`],
      `Session ${index + 1} name`,
      100
    );
    if (!title.ok) return title;
    const reading = text(
      input[`${field}_reading`],
      `Session ${index + 1} guidance`,
      500
    );
    if (!reading.ok) return reading;
    const prompt = text(
      input[`${field}_prompt`],
      `Session ${index + 1} reflection prompt`,
      500
    );
    if (!prompt.ok) return prompt;
    const minutes = integer(
      input[`${field}_minutes`],
      `Session ${index + 1} estimated minutes`,
      1,
      240
    );
    if (!minutes.ok) return minutes;

    stages.push({
      id:
        existingJourney.stages[index]?.id ??
        `session-${index + 1}-${randomUUID().slice(0, 8)}`,
      number: String(index + 1).padStart(2, '0'),
      title: title.value,
      reading: reading.value,
      prompt: prompt.value,
      minutes: minutes.value,
    });
  }

  const finalPageLabel = text(
    input.finalPageLabel,
    'Final page section label',
    80
  );
  if (!finalPageLabel.ok) return finalPageLabel;
  const finalPagePendingTitle = text(
    input.finalPagePendingTitle,
    'Final page heading before completion',
    140
  );
  if (!finalPagePendingTitle.ok) return finalPagePendingTitle;
  const finalPagePendingDescription = text(
    input.finalPagePendingDescription,
    'Final page message before completion',
    600
  );
  if (!finalPagePendingDescription.ok) return finalPagePendingDescription;
  const finalPageCompletedTitle = text(
    input.finalPageCompletedTitle,
    'Final page heading after completion',
    140
  );
  if (!finalPageCompletedTitle.ok) return finalPageCompletedTitle;
  const finalPageCompletedDescription = text(
    input.finalPageCompletedDescription,
    'Final page message after completion',
    600
  );
  if (!finalPageCompletedDescription.ok) return finalPageCompletedDescription;

  return {
    ok: true,
    value: {
      label: details.label,
      title: details.title,
      subtitle: details.subtitle,
      description: details.description,
      resources,
      finalPage: {
        label: finalPageLabel.value,
        pendingTitle: finalPagePendingTitle.value,
        pendingDescription: finalPagePendingDescription.value,
        completedTitle: finalPageCompletedTitle.value,
        completedDescription: finalPageCompletedDescription.value,
      },
      stages,
    },
  };
};
