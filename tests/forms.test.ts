import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseJourneyDetails,
  parseJourneySessions,
} from '../src/server/core/forms.ts';
import {
  MAX_JOURNEY_RESOURCES,
  MAX_JOURNEY_STAGES,
  starterJourney,
} from '../src/shared/journey.ts';

test('the editor accepts the documented maximum resources and sessions', () => {
  const details = parseJourneyDetails(
    {
      postTitle: 'A complete learning journey',
      label: 'Learning journey',
      title: 'Learn together',
      subtitle: 'A short introduction',
      description: 'A useful description',
      resourceCount: MAX_JOURNEY_RESOURCES,
      sessionCount: MAX_JOURNEY_STAGES,
    },
    {
      operation: 'create',
      postTitle: 'Learning Group · A community learning journey',
    }
  );
  assert.equal(details.ok, true);
  if (!details.ok) return;

  const input: Record<string, unknown> = {
    finalPageLabel: 'Closing reflection',
    finalPagePendingTitle: 'Keep learning',
    finalPagePendingDescription: 'Complete each session first.',
    finalPageCompletedTitle: 'Journey complete',
    finalPageCompletedDescription: 'Return to the discussion.',
  };
  for (let index = 1; index <= MAX_JOURNEY_RESOURCES; index += 1) {
    input[`resource_${index}_title`] = `Resource ${index}`;
    input[`resource_${index}_url`] = `https://example.com/resource-${index}`;
  }
  for (let index = 1; index <= MAX_JOURNEY_STAGES; index += 1) {
    input[`stage_${index}_title`] = `Session ${index}`;
    input[`stage_${index}_reading`] = `Read part ${index}.`;
    input[`stage_${index}_prompt`] = `What did session ${index} show you?`;
    input[`stage_${index}_minutes`] = 15;
  }

  const journey = parseJourneySessions(input, details.value, starterJourney);
  assert.equal(journey.ok, true);
  if (!journey.ok) return;
  assert.equal(journey.value.resources.length, MAX_JOURNEY_RESOURCES);
  assert.equal(journey.value.stages.length, MAX_JOURNEY_STAGES);
  assert.equal(
    new Set(journey.value.stages.map((stage) => stage.id)).size,
    MAX_JOURNEY_STAGES
  );
});

test('the editor rejects unsafe resource URLs', () => {
  const details = {
    operation: 'create' as const,
    postTitle: 'Learning journey',
    label: 'Journey',
    title: 'Learn',
    subtitle: 'Together',
    description: 'Description',
    resourceCount: 1,
    sessionCount: 1,
  };
  const journey = parseJourneySessions(
    {
      resource_1_title: 'Unsafe',
      resource_1_url: 'https://username:password@example.com',
    },
    details,
    starterJourney
  );
  assert.equal(journey.ok, false);
});

test('the editor rechecks URL length after normalization', () => {
  const details = {
    operation: 'create' as const,
    postTitle: 'Learning journey',
    label: 'Journey',
    title: 'Learn',
    subtitle: 'Together',
    description: 'Description',
    resourceCount: 1,
    sessionCount: 1,
  };
  const urlPrefix = 'https://example.com?value=';
  const input: Record<string, unknown> = {
    resource_1_title: 'Long URL',
    resource_1_url: `${urlPrefix}${'x'.repeat(2048 - urlPrefix.length)}`,
  };
  assert.equal(String(input.resource_1_url).length, 2048);
  const journey = parseJourneySessions(input, details, starterJourney);
  assert.equal(journey.ok, false);
});
