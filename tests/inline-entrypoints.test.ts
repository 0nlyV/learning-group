import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readProjectFile = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const config = JSON.parse(readProjectFile('devvit.json')) as {
  post: {
    entrypoints: Record<string, { entry: string; inline?: boolean }>;
  };
};

test('long Portal content is reserved for expanded mode', () => {
  assert.deepEqual(config.post.entrypoints.hub, {
    inline: true,
    entry: 'hub-preview.html',
  });
  assert.deepEqual(config.post.entrypoints.hubExpanded, {
    entry: 'hub.html',
  });

  const preview = readProjectFile('src/client/hub-preview.tsx');
  assert.match(
    preview,
    /requestExpandedMode\(event\.nativeEvent, 'hubExpanded'\)/
  );
});

test('inline documents use a bounded, vertically pannable surface', () => {
  for (const path of [
    'src/client/splash.html',
    'src/client/hub-preview.html',
  ]) {
    const html = readProjectFile(path);
    assert.match(html, /class="h-full inline-document"/);
    assert.match(html, /<body class="inline-body">/);
  }

  const css = readProjectFile('src/client/index.css');
  assert.match(css, /body\.inline-body[\s\S]*overflow: hidden;/);
  assert.match(css, /body\.inline-body[\s\S]*touch-action: pan-y;/);
  assert.doesNotMatch(css, /touch-action:\s*none/);
  assert.doesNotMatch(css, /overscroll-behavior:\s*none/);
});
