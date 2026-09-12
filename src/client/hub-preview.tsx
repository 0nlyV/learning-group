import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { HubPreviewResponse } from '../shared/api';
import { BrandIcon } from './brand-icon';
import './index.css';
import { runJourneyEditor } from './journey-editor';

type PreviewState = {
  loading: boolean;
  error: string | null;
  subredditName: string;
  isModerator: boolean;
  activeJourneyCount: number;
  concludedJourneyCount: number;
};

const initialState: PreviewState = {
  loading: true,
  error: null,
  subredditName: '',
  isModerator: false,
  activeJourneyCount: 0,
  concludedJourneyCount: 0,
};

const journeySnapshot = ({
  loading,
  activeJourneyCount,
  concludedJourneyCount,
}: PreviewState) => {
  if (loading) return 'Loading journey snapshot…';
  if (activeJourneyCount === 0) {
    return concludedJourneyCount === 0
      ? 'No active journeys yet'
      : `No active journeys · ${concludedJourneyCount} concluded`;
  }

  const activeLabel = `${activeJourneyCount} active ${
    activeJourneyCount === 1 ? 'journey' : 'journeys'
  }`;
  return `${activeLabel} · ${concludedJourneyCount} concluded`;
};

const HubPreview = () => {
  const [state, setState] = useState(initialState);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/hub/preview');
        if (!response.ok) throw new Error('The Portal could not load.');
        const data: HubPreviewResponse = await response.json();
        setState({
          loading: false,
          error: null,
          subredditName: data.subredditName,
          isModerator: data.isModerator,
          activeJourneyCount: data.activeJourneyCount,
          concludedJourneyCount: data.concludedJourneyCount,
        });
      } catch (error) {
        setState({
          loading: false,
          error:
            error instanceof Error ? error.message : 'Something went wrong.',
          subredditName: '',
          isModerator: false,
          activeJourneyCount: 0,
          concludedJourneyCount: 0,
        });
      }
    };
    void load();
  }, []);

  const createJourney = async () => {
    setEditorOpen(true);
    await runJourneyEditor('create');
    setEditorOpen(false);
  };

  const alternateButtonLabel = state.isModerator
    ? 'Moderator tools are available inside.'
    : 'Follow journeys at your own pace.';

  return (
    <main className="hub-preview-shell">
      <div className="grain" aria-hidden="true" />
      <div className="hub-preview-motif" aria-hidden="true">
        <svg viewBox="0 0 320 240" role="presentation">
          <path
            className="hub-preview-motif-flame"
            d="M167 24c-38 35-42 69-25 102-10-9-19-22-24-38-27 31-35 62-23 87 14 29 43 42 70 42 43 0 77-31 77-73 0-35-21-66-45-91 3 26-7 46-26 61 8-31 4-59-4-90Z"
          />
          <path
            className="hub-preview-motif-ember"
            d="M224 58c22 25 38 52 38 82 0 25-10 47-29 63 10-25 7-48-9-69 12-24 13-49 0-76Z"
          />
          <path
            className="hub-preview-motif-book"
            d="M50 181c38-11 73-5 107 23v30c-33-24-67-31-107-20v-33Zm220 0c-38-11-73-5-107 23v30c33-24 67-31 107-20v-33Z"
          />
        </svg>
        <p>Gather · Unite · Share</p>
      </div>
      <section className="hub-preview-copy" aria-labelledby="portal-title">
        <div className="brand-mark">
          <BrandIcon />
          <span className="hub-community-name">
            {state.loading
              ? 'Opening community…'
              : state.subredditName
                ? `r/${state.subredditName}`
                : 'Reddit community'}
          </span>
          <span className="hub-product-name">Learning Group</span>
        </div>
        <div>
          <h1 id="portal-title">Learning Group Portal</h1>
          <p className="hub-preview-snapshot" aria-live="polite">
            {journeySnapshot(state)}
          </p>
          <p className="hub-preview-description">
            A place for communities to learn, reflect, and return to the
            discussion.
          </p>
          {state.error ? (
            <p className="hub-preview-error" role="alert">
              {state.error} You can still try opening the Portal.
            </p>
          ) : null}
        </div>
      </section>
      <section className="hub-preview-action" aria-label="Open Portal">
        {state.isModerator ? (
          <button
            className="hub-preview-create-button"
            disabled={editorOpen}
            onClick={() => void createJourney()}
          >
            <span aria-hidden="true">＋</span>
            {editorOpen ? 'Opening editor…' : 'Create Journey'}
          </button>
        ) : null}
        <button
          className="hub-preview-button"
          aria-label="Open Portal"
          onClick={(event) =>
            requestExpandedMode(event.nativeEvent, 'hubExpanded')
          }
        >
          <span className="hub-preview-button-copy" aria-hidden="true">
            <span className="hub-preview-button-label is-primary">
              Open Portal
            </span>
            <span className="hub-preview-button-label is-alternate">
              {alternateButtonLabel}
            </span>
          </span>
          <span className="hub-preview-button-arrow" aria-hidden="true">
            →
          </span>
        </button>
      </section>
    </main>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HubPreview />
  </StrictMode>
);
