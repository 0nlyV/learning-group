import { navigateTo, showToast } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  HubInitResponse,
  HubJourneySummary,
  JourneyStatusResponse,
} from '../shared/api';
import { BrandIcon } from './brand-icon';
import './index.css';
import { runJourneyEditor } from './journey-editor';

type HubState = {
  loading: boolean;
  error: string | null;
  subredditName: string;
  isModerator: boolean;
  journeys: HubJourneySummary[];
};

const initialState: HubState = {
  loading: true,
  error: null,
  subredditName: '',
  isModerator: false,
  journeys: [],
};

const participantCountLabel = (count: number) =>
  count === 0
    ? 'Ready for its first participant'
    : `${count} participant${count === 1 ? '' : 's'} taking part`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'The journey status could not be updated.';

const Hub = () => {
  const [state, setState] = useState(initialState);
  const [editorOpen, setEditorOpen] = useState<string | null>(null);
  const [statusSavingPostId, setStatusSavingPostId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/hub/init');
        if (!response.ok) throw new Error('The portal could not load.');
        const data: HubInitResponse = await response.json();
        setState({
          loading: false,
          error: null,
          subredditName: data.subredditName,
          isModerator: data.isModerator,
          journeys: data.journeys,
        });
      } catch (error) {
        setState((current) => ({
          ...current,
          loading: false,
          error:
            error instanceof Error ? error.message : 'Something went wrong.',
        }));
      }
    };
    void load();
  }, []);

  const openEditor = async (
    operation: 'create' | 'edit',
    sourcePostId?: string
  ) => {
    setEditorOpen(`${operation}:${sourcePostId ?? 'starter'}`);
    await runJourneyEditor(operation, sourcePostId);
    setEditorOpen(null);
  };

  const setJourneyStatus = async (
    journey: HubJourneySummary,
    concluded: boolean
  ) => {
    setStatusSavingPostId(journey.postId);
    try {
      const response = await fetch('/api/hub/journey-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: journey.postId, concluded }),
      });
      const data = (await response.json()) as
        JourneyStatusResponse | { status: 'error'; message?: string };
      if (!response.ok || data.status !== 'ok') {
        throw new Error(
          'message' in data && data.message
            ? data.message
            : 'The journey status could not be updated.'
        );
      }

      setState((current) => ({
        ...current,
        journeys: current.journeys.map((item) =>
          item.postId === data.postId
            ? { ...item, concludedAt: data.concludedAt }
            : item
        ),
      }));
      showToast({
        text: concluded
          ? 'Journey moved to Concluded journeys.'
          : 'Journey reopened and moved to Active journeys.',
        appearance: 'success',
      });
    } catch (error) {
      showToast({ text: errorMessage(error), appearance: 'neutral' });
    } finally {
      setStatusSavingPostId(null);
    }
  };

  if (state.loading) {
    return <main className="hub-shell loading-card">Opening the portal…</main>;
  }

  if (state.error) {
    return (
      <main className="hub-shell loading-card" role="alert">
        <p>{state.error}</p>
        <button
          className="primary-button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </main>
    );
  }

  const activeJourneys = state.journeys
    .filter((journey) => !journey.concludedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const concludedJourneys = state.journeys
    .filter((journey) => journey.concludedAt)
    .sort((a, b) => (b.concludedAt ?? '').localeCompare(a.concludedAt ?? ''));
  const actionsDisabled = editorOpen !== null || statusSavingPostId !== null;

  const journeyGrid = (journeys: HubJourneySummary[], concluded: boolean) => (
    <div className="hub-journey-grid">
      {journeys.map((journey) => (
        <article
          className={`hub-journey-card ${concluded ? 'is-concluded' : 'is-active'}`}
          key={journey.postId}
        >
          <div>
            <div className="hub-card-heading">
              <p className="hub-card-label">{journey.label}</p>
              {concluded ? (
                <span className="hub-status-badge">Concluded</span>
              ) : null}
            </div>
            <h3>{journey.title}</h3>
            <p className="hub-card-copy">{journey.subtitle}</p>
          </div>
          <div className="hub-card-meta">
            <span>
              {journey.sessionCount} session
              {journey.sessionCount === 1 ? '' : 's'}
            </span>
            <span>{participantCountLabel(journey.participantCount)}</span>
            <span>Started {formatDate(journey.createdAt)}</span>
            {journey.concludedAt ? (
              <span>Concluded {formatDate(journey.concludedAt)}</span>
            ) : null}
          </div>
          <div className="hub-card-actions">
            <button
              className="hub-open-button"
              onClick={() => navigateTo(journey.postUrl)}
            >
              Open journey
            </button>
            {state.isModerator ? (
              <>
                <button
                  className="hub-text-button"
                  disabled={actionsDisabled}
                  onClick={() => void openEditor('edit', journey.postId)}
                >
                  Edit
                </button>
                <button
                  className="hub-text-button"
                  disabled={actionsDisabled}
                  onClick={() => void openEditor('create', journey.postId)}
                >
                  Use as template
                </button>
                <button
                  className="hub-text-button hub-status-button"
                  disabled={actionsDisabled}
                  onClick={() => void setJourneyStatus(journey, !concluded)}
                >
                  {statusSavingPostId === journey.postId
                    ? concluded
                      ? 'Reopening…'
                      : 'Concluding…'
                    : concluded
                      ? 'Reopen'
                      : 'Conclude'}
                </button>
              </>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <main className="hub-shell">
      <div className="grain" aria-hidden="true" />
      <header className="hub-header">
        <div className="brand-mark">
          <BrandIcon />
          <span className="hub-community-name">r/{state.subredditName}</span>
          <span className="hub-product-name">Learning Group Portal</span>
        </div>
        {state.isModerator ? (
          <div className="hub-header-actions">
            <button
              className="hub-header-create"
              disabled={editorOpen !== null}
              onClick={() => void openEditor('create')}
            >
              <span className="hub-moderator-label">Moderator</span>
              <span>Create new journey</span>
              <span aria-hidden="true">＋</span>
            </button>
          </div>
        ) : null}
      </header>

      <section className="hub-intro">
        <h1>Where community learn and discuss.</h1>
      </section>

      <section className="hub-journeys" aria-labelledby="hub-journey-heading">
        <div className="hub-section-heading">
          <h2 id="hub-journey-heading">Learning journeys</h2>
          {state.journeys.length ? (
            <p>{`${activeJourneys.length} active · ${concludedJourneys.length} concluded`}</p>
          ) : null}
        </div>

        {activeJourneys.length ? (
          <section
            className="hub-journey-group"
            aria-labelledby="active-heading"
          >
            <div className="hub-group-heading">
              <h3 id="active-heading">Active journeys</h3>
              <p>Open now for learning and discussion.</p>
            </div>
            {journeyGrid(activeJourneys, false)}
          </section>
        ) : state.journeys.length ? (
          <div className="hub-empty-state hub-empty-active">
            <p className="eyebrow">Between journeys</p>
            <h3>No journeys are active right now.</h3>
            <p>
              {state.isModerator
                ? 'Create a new journey or reopen one from the concluded collection below.'
                : 'A moderator can publish or reopen the community’s next journey.'}
            </p>
          </div>
        ) : (
          <div className="hub-empty-state">
            <p className="eyebrow">An open shelf</p>
            <h3>The first journey will appear here.</h3>
            <p>
              {state.isModerator
                ? 'Use Create new journey above to begin.'
                : 'A community moderator can add one—check back soon.'}
            </p>
          </div>
        )}

        {concludedJourneys.length ? (
          <section
            className="hub-journey-group hub-concluded-group"
            aria-labelledby="concluded-heading"
          >
            <div className="hub-group-heading">
              <h3 id="concluded-heading">Concluded journeys</h3>
              <p>Completed community journeys kept available for reference.</p>
            </div>
            {journeyGrid(concludedJourneys, true)}
          </section>
        ) : null}
      </section>

      <details className="hub-participant-guide" open={!state.isModerator}>
        <summary>For participants</summary>
        <p className="hub-participant-guide-content">
          Choose a journey, complete its sessions at your pace, then join the
          post discussion.
        </p>
      </details>
    </main>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Hub />
  </StrictMode>
);
