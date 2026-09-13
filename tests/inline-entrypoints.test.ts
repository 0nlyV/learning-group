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
  assert.match(preview, /activeJourneyCount/);
  assert.match(preview, /archivedJourneyCount/);
  assert.match(preview, /Portal Summary/);
  assert.match(preview, /isModerator/);
  assert.match(preview, /Create Journey/);
  assert.match(preview, /Moderator tools are available inside/);
  assert.match(preview, /Follow journeys at your own pace/);
  assert.doesNotMatch(preview, /Community learning/);
  assert.match(preview, /Gather · Unite · Share/);
  assert.match(preview, /→ Open Portal/);
  assert.doesNotMatch(preview, /A place for communities to learn/);

  const css = readProjectFile('src/client/index.css');
  assert.match(css, /hub-preview-primary-label 15s/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  const snapshotStyle = css.match(
    /\.hub-preview-snapshot\s*\{([\s\S]*?)\}/
  )?.[1];
  assert.ok(snapshotStyle);
  assert.match(snapshotStyle, /font-size: clamp\(16px, 2vw, 19px\)/);
  assert.doesNotMatch(snapshotStyle, /border|background|cursor/);
  assert.match(
    css,
    /hub-preview-button-label\.is-hover[\s\S]*transition: opacity 360ms ease/
  );
  assert.match(css, /hub-preview-button:hover[\s\S]*is-hover/);

  const previewRoute = readProjectFile('src/server/routes/api.ts');
  assert.match(previewRoute, /archivedJourneyCount:[\s\S]*archivedAt/);
});

test('Portal actions stay grouped and visually distinct', () => {
  const hub = readProjectFile('src/client/hub.tsx');
  assert.match(hub, /hub-card-action-main/);
  assert.match(hub, /hub-card-action-lifecycle/);

  const css = readProjectFile('src/client/index.css');
  const openButtonStyle = css.match(/\.hub-open-button\s*\{([\s\S]*?)\}/)?.[1];
  const archiveButtonStyle = css.match(
    /\.hub-archive-button\s*\{([\s\S]*?)\}/
  )?.[1];
  assert.ok(openButtonStyle);
  assert.match(openButtonStyle, /border-color: var\(--color-portal-accent\)/);
  assert.ok(archiveButtonStyle);
  assert.doesNotMatch(archiveButtonStyle, /margin-left:\s*auto/);
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
