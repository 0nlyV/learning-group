import assert from 'node:assert/strict';
import test from 'node:test';
import { starterJourney } from '../src/shared/journey.ts';
import { isJourney } from '../src/shared/journey-validation.ts';

test('the starter journey passes persisted-data validation', () => {
  assert.equal(isJourney(starterJourney), true);
});

test('duplicate identifiers and credential-bearing URLs are rejected', () => {
  assert.equal(
    isJourney({
      ...starterJourney,
      stages: [starterJourney.stages[0], starterJourney.stages[0]],
    }),
    false
  );
  assert.equal(
    isJourney({
      ...starterJourney,
      resources: [
        {
          id: 'unsafe-resource',
          title: 'Unsafe resource',
          url: 'https://username:password@example.com/resource',
        },
      ],
    }),
    false
  );
});
