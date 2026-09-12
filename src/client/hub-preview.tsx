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
};

const initialState: PreviewState = {
  loading: true,
  error: null,
  subredditName: '',
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
        });
      } catch (error) {
        setState({
          loading: false,
          error:
            error instanceof Error ? error.message : 'Something went wrong.',
          subredditName: '',
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
          <p className="hub-preview-description">
            Browse learning journeys and open the moderator tools in a dedicated
            view.
          </p>
          {state.error ? (
            <p className="hub-preview-error" role="alert">
              {state.error} You can still try opening the Portal.
            </p>
          ) : null}
        </div>
      </section>
      <section className="hub-preview-action" aria-label="Open Portal">
        <p>Designed for comfortable browsing without interrupting the feed.</p>
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
