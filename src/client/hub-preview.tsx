import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { HubPreviewResponse } from '../shared/api';
import { BrandIcon } from './brand-icon';
import './index.css';

type PreviewState = {
  loading: boolean;
  error: string | null;
  subredditName: string;
  activeJourneyCount: number;
  concludedJourneyCount: number;
};

const initialState: PreviewState = {
  loading: true,
  error: null,
  subredditName: '',
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
          activeJourneyCount: data.activeJourneyCount,
          concludedJourneyCount: data.concludedJourneyCount,
        });
      } catch (error) {
        setState({
          loading: false,
          error:
            error instanceof Error ? error.message : 'Something went wrong.',
          subredditName: '',
          activeJourneyCount: 0,
          concludedJourneyCount: 0,
        });
      }
    };
    void load();
  }, []);

  return (
    <main className="hub-preview-shell">
      <div className="grain" aria-hidden="true" />
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
          <p className="eyebrow">Community learning</p>
          <h1 id="portal-title">Learning Group Portal</h1>
          <p className="hub-preview-snapshot" aria-live="polite">
            {journeySnapshot(state)}
          </p>
          <p className="hub-preview-description">
            Browse journeys at your own pace. Moderator tools are available
            inside.
          </p>
          {state.error ? (
            <p className="hub-preview-error" role="alert">
              {state.error} You can still try opening the Portal.
            </p>
          ) : null}
        </div>
      </section>
      <section className="hub-preview-action" aria-label="Open Portal">
        <button
          className="hub-preview-button"
          onClick={(event) =>
            requestExpandedMode(event.nativeEvent, 'hubExpanded')
          }
        >
          Open Portal
          <span aria-hidden="true">→</span>
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
