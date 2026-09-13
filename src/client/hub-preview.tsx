import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import learningGroupIcon from '../../assets/icon.png';
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
  archivedJourneyCount: number;
};

const initialState: PreviewState = {
  loading: true,
  error: null,
  subredditName: '',
  isModerator: false,
  activeJourneyCount: 0,
  concludedJourneyCount: 0,
  archivedJourneyCount: 0,
};

const journeySnapshot = ({
  loading,
  activeJourneyCount,
  concludedJourneyCount,
  archivedJourneyCount,
}: PreviewState) => {
  if (loading) return 'Loading journey snapshot…';
  const activeLabel =
    activeJourneyCount === 0
      ? 'No active journeys'
      : `${activeJourneyCount} active ${
          activeJourneyCount === 1 ? 'journey' : 'journeys'
        }`;
  return `${activeLabel} · ${concludedJourneyCount} concluded · ${archivedJourneyCount} archived`;
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
          archivedJourneyCount: data.archivedJourneyCount,
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
          archivedJourneyCount: 0,
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
        <span className="hub-preview-motif-halo" />
        <img src={learningGroupIcon} alt="" />
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
          <h1 id="portal-title">Portal Summary</h1>
          <p className="hub-preview-snapshot" aria-live="polite">
            {journeySnapshot(state)}
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
              → Open Portal
            </span>
            <span className="hub-preview-button-label is-alternate">
              {alternateButtonLabel}
            </span>
            <span className="hub-preview-button-label is-hover">
              {alternateButtonLabel}
            </span>
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
