import { navigateTo, showForm, showToast } from '@devvit/web/client';
import type {
  JourneyEditorDetailsResponse,
  JourneyEditorErrorResponse,
  JourneyEditorOperation,
  JourneyEditorSaveResponse,
  JourneyEditorStartResponse,
} from '../shared/api';

type FormInput = Record<string, unknown>;

const jsonRequest = async <T>(url: string, body?: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    ...(body === undefined
      ? {}
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
  });
  const data = (await response.json()) as T;
  if (!response.ok) throw data;
  return data;
};

const errorMessage = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'message' in error &&
  typeof error.message === 'string'
    ? error.message
    : 'The journey editor could not continue.';

export const runJourneyEditor = async (
  operation: JourneyEditorOperation,
  sourcePostId?: string
): Promise<void> => {
  try {
    const query = new URLSearchParams({ operation });
    if (sourcePostId) query.set('sourcePostId', sourcePostId);
    const start = await jsonRequest<JourneyEditorStartResponse>(
      `/api/editor/start?${query.toString()}`
    );
    const resolvedSourcePostId = start.sourcePostId;
    let detailsForm = start.detailsForm;

    while (true) {
      const detailsResult = await showForm(detailsForm);
      if (detailsResult.action === 'CANCELED') return;
      const detailsInput = detailsResult.values as FormInput;

      let details: JourneyEditorDetailsResponse;
      try {
        details = await jsonRequest<JourneyEditorDetailsResponse>(
          '/api/editor/details',
          {
            operation,
            sourcePostId: resolvedSourcePostId,
            input: detailsInput,
          }
        );
      } catch (error) {
        const failure = error as JourneyEditorErrorResponse;
        showToast({ text: errorMessage(error), appearance: 'neutral' });
        if (failure.form) detailsForm = failure.form;
        continue;
      }

      let sessionsForm = details.sessionsForm;
      while (true) {
        const sessionsResult = await showForm(sessionsForm);
        if (sessionsResult.action === 'CANCELED') {
          detailsForm = details.detailsForm;
          break;
        }

        try {
          const saved = await jsonRequest<JourneyEditorSaveResponse>(
            '/api/editor/save',
            {
              operation,
              sourcePostId: resolvedSourcePostId,
              detailsInput,
              sessionsInput: sessionsResult.values as FormInput,
            }
          );
          showToast({
            text:
              operation === 'create'
                ? 'New journey post created. Opening it now.'
                : 'Learning Group updated.',
            appearance: 'success',
          });
          navigateTo(saved.postUrl);
          return;
        } catch (error) {
          const failure = error as JourneyEditorErrorResponse;
          showToast({ text: errorMessage(error), appearance: 'neutral' });
          if (failure.step === 'details') {
            if (failure.form) detailsForm = failure.form;
            break;
          }
          if (failure.form) sessionsForm = failure.form;
        }
      }
    }
  } catch (error) {
    showToast({ text: errorMessage(error), appearance: 'neutral' });
  }
};
