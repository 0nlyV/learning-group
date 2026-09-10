import { exitExpandedMode, navigateTo } from '@devvit/web/client';
import { StrictMode, type CSSProperties, type MouseEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { useJourney } from './hooks/useJourney';
import './index.css';

const JourneyApp = () => {
  const {
    journey,
    postUrl,
    username,
    loading,
    error,
    completedStageIds,
    participantCount,
    completionCounts,
    savingStageId,
    percentage,
    toggleStage,
  } = useJourney();

  if (loading) {
    return (
      <main className="app-shell loading-card">Setting your bookmark…</main>
    );
  }

  if (error || !journey) {
    return (
      <main className="app-shell loading-card" role="alert">
        <p>{error ?? 'This journey could not be opened.'}</p>
        <button
          className="primary-button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </main>
    );
  }

  const finished = completedStageIds.length === journey.stages.length;
  const sessionCount = journey.stages.length;
  const sessionLabel = `${sessionCount} thoughtful session${sessionCount === 1 ? '' : 's'}`;

  const closeReadingView = (event: MouseEvent<HTMLButtonElement>) => {
    try {
      exitExpandedMode(event.nativeEvent);
    } catch (error) {
      console.error('Could not close the learning view.', error);
    }
  };

  return (
    <main className="app-shell">
      <div className="grain" aria-hidden="true" />
      <header className="app-header">
        <div className="brand-mark">
          <span className="brand-icon" aria-hidden="true">
            L
          </span>
          <span>Learning Group</span>
        </div>
        <span className="reader-chip">@{username}</span>
      </header>

      <section className="hero-grid">
        <div>
          <p className="eyebrow">{journey.label}</p>
          <h1>{journey.title}</h1>
          <p className="hero-description">{journey.description}</p>
        </div>

        <aside className="progress-card">
          <div
            className="progress-ring"
            style={{ '--progress': `${percentage * 3.6}deg` } as CSSProperties}
          >
            <div>
              <strong>{percentage}%</strong>
              <span>complete</span>
            </div>
          </div>
          <div>
            <strong>
              {completedStageIds.length} of {journey.stages.length}
            </strong>
            <span>Your quiet progress</span>
          </div>
          <div>
            <strong>{participantCount || '—'}</strong>
            <span>Participants</span>
          </div>
        </aside>
      </section>

      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}

      {journey.resources.length ? (
        <section
          className="resource-section"
          aria-labelledby="resources-heading"
        >
          <div className="resource-heading">
            <div>
              <p className="eyebrow">Shared resources</p>
              <h2 id="resources-heading">Explore alongside the journey</h2>
            </div>
            <p>
              Right-click a URL and choose “Open link in new tab”. On mobile,
              press and hold the URL.
            </p>
          </div>
          <div className="resource-list">
            {journey.resources.map((resource) => (
              <article className="resource-item" key={resource.id}>
                <strong>{resource.title}</strong>
                <a
                  className="resource-url"
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${resource.title} in a new tab`}
                >
                  {resource.url}
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="stage-section" aria-labelledby="sessions-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your path</p>
            <h2 id="sessions-heading">{sessionLabel}</h2>
          </div>
          <p>Move at your own pace. No streaks to lose.</p>
        </div>

        <div className="stage-list">
          {journey.stages.map((stage) => {
            const complete = completedStageIds.includes(stage.id);
            const readers = completionCounts[stage.id] ?? 0;
            return (
              <article
                className={`stage-card ${complete ? 'is-complete' : ''}`}
                key={stage.id}
              >
                <div className="stage-number">{stage.number}</div>
                <div className="stage-body">
                  <div className="stage-title-row">
                    <div>
                      <p className="stage-kicker">
                        {stage.minutes} minute session
                      </p>
                      <h3>{stage.title}</h3>
                    </div>
                    <span className="reader-count">{readers} finished</span>
                  </div>
                  <p className="reading-instruction">{stage.reading}</p>
                  <blockquote>“{stage.prompt}”</blockquote>
                </div>
                <button
                  className="complete-button"
                  aria-pressed={complete}
                  disabled={savingStageId === stage.id}
                  onClick={() => void toggleStage(stage.id)}
                >
                  <span aria-hidden="true">{complete ? '✓' : '○'}</span>
                  {savingStageId === stage.id
                    ? 'Saving…'
                    : complete
                      ? 'Completed'
                      : 'Mark complete'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className={`closing-card ${finished ? 'is-visible' : ''}`}
        aria-label="Conclusion and Learning Group actions"
      >
        <div className="closing-copy">
          <p className="eyebrow">{journey.finalPage.label}</p>
          <h2>
            {finished
              ? journey.finalPage.completedTitle
              : journey.finalPage.pendingTitle}
          </h2>
          <p>
            {finished
              ? journey.finalPage.completedDescription
              : journey.finalPage.pendingDescription}
          </p>
        </div>
        <div className="journey-action-buttons">
          {finished ? (
            <button
              className="discussion-button"
              disabled={!postUrl}
              onClick={() => navigateTo(postUrl)}
            >
              Join the discussion
              <span aria-hidden="true">→</span>
            </button>
          ) : null}
          <button className="close-button" onClick={closeReadingView}>
            Close learning view
          </button>
        </div>
      </section>
    </main>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JourneyApp />
  </StrictMode>
);
