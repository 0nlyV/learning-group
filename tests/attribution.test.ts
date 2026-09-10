import assert from 'node:assert/strict';
import test from 'node:test';
import {
  journeyAttributionFits,
  journeyAttributionText,
  MAX_JOURNEY_ATTRIBUTION_LENGTH,
} from '../src/shared/attribution.ts';
import {
  MAX_JOURNEY_RESOURCES,
  MAX_JOURNEY_STAGES,
  starterJourney,
  type Journey,
} from '../src/shared/journey.ts';

const repeated = (length: number) => 'x'.repeat(length);
const longUrl = () => {
  const prefix = 'https://example.com/';
  return `${prefix}${repeated(2048 - prefix.length)}`;
};

const largestAllowedJourney: Journey = {
  label: repeated(80),
  title: repeated(120),
  subtitle: repeated(240),
  description: repeated(800),
  resources: Array.from({ length: MAX_JOURNEY_RESOURCES }, (_, index) => ({
    id: `resource-${index}`,
    title: repeated(100),
    url: longUrl(),
  })),
  finalPage: {
    label: repeated(80),
    pendingTitle: repeated(140),
    pendingDescription: repeated(600),
    completedTitle: repeated(140),
    completedDescription: repeated(600),
  },
  stages: Array.from({ length: MAX_JOURNEY_STAGES }, (_, index) => ({
    id: `stage-${index}`,
    number: String(index + 1),
    title: repeated(100),
    reading: repeated(500),
    prompt: repeated(500),
    minutes: 240,
  })),
};

test('all currently permitted journey content fits the attribution budget', () => {
  const text = journeyAttributionText(repeated(300), largestAllowedJourney);
  assert.ok(text.length <= MAX_JOURNEY_ATTRIBUTION_LENGTH);
  assert.equal(
    journeyAttributionFits(repeated(300), largestAllowedJourney),
    true
  );
});

test('attribution content is rejected instead of silently truncated', () => {
  assert.equal(
    journeyAttributionFits('Post', {
      ...starterJourney,
      description: repeated(MAX_JOURNEY_ATTRIBUTION_LENGTH),
    }),
    false
  );
});
