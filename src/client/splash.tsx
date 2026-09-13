import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import learningGroupIcon from '../../assets/icon.png';
import { BrandIcon } from './brand-icon';
import { useJourney } from './hooks/useJourney';
import './index.css';

const Splash = () => {
  const {
    journey,
    subredditName,
    loading,
    error,
    completedStageIds,
    participantCount,
    percentage,
  } = useJourney();

  if (loading) {
    return (
      <main className="splash-shell loading-card">Opening the next page…</main>
    );
  }

  if (error || !journey) {
    return (
      <main className="splash-shell loading-card" role="alert">
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

  const previewCopyLength =
    journey.label.length + journey.title.length + journey.subtitle.length;
  const copyDensityClass =
    previewCopyLength > 300
      ? ' is-copy-very-dense'
      : previewCopyLength > 180
        ? ' is-copy-dense'
        : '';

  return (
    <main className={`splash-shell${copyDensityClass}`}>
      <div className="grain" aria-hidden="true" />
      <div className="journey-preview-motif" aria-hidden="true">
        <span className="journey-preview-motif-halo" />
        <img src={learningGroupIcon} alt="" />
        <p>Gather · Unite · Share</p>
      </div>
      <section className="splash-copy" aria-labelledby="journey-preview-title">
        <div className="brand-mark">
          <BrandIcon />
          <span className="journey-community-name">r/{subredditName}</span>
          <span className="journey-product-name">Learning Group</span>
        </div>
        <div className="journey-preview-summary">
          <p className="eyebrow">{journey.label}</p>
          <h1 id="journey-preview-title">{journey.title}</h1>
          <p className="splash-subtitle">{journey.subtitle}</p>
        </div>
      </section>

      <section className="splash-action" aria-label="Journey progress">
        <div className="community-note">
          <span className="pulse-dot" aria-hidden="true" />
          {participantCount === 0
            ? 'Be the first participant'
            : `${participantCount} participant${participantCount === 1 ? '' : 's'} taking part`}
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Your journey progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
        >
          <span style={{ width: `${percentage}%` }} />
        </div>
        <button
          className="primary-button"
          onClick={(event) => requestExpandedMode(event.nativeEvent, 'journey')}
        >
          {completedStageIds.length ? 'Continue learning' : 'Begin the journey'}
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
