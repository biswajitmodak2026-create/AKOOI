import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PHOTO_ADJUSTMENTS,
  buildCssFilterString,
  clampTrimRange,
  computeAspectDimensions,
  formatTimecode,
  splitScenesFromPrompt,
  wrapTextLines,
} from './mediaMath';

test('formatTimecode formats seconds cleanly with tenths', () => {
  assert.equal(formatTimecode(0), '00:00.0');
  assert.equal(formatTimecode(4.25), '00:04.2');
  assert.equal(formatTimecode(65.9), '01:05.9');
  assert.equal(formatTimecode(-2), '00:00.0');
});

test('clampTrimRange enforces bounds and minimum gap', () => {
  assert.deepEqual(clampTrimRange(-1, 20, 10, 0.5), { start: 0, end: 10 });
  assert.deepEqual(clampTrimRange(5, 5.1, 10, 0.5), { start: 5, end: 5.5 });
  assert.deepEqual(clampTrimRange(9.8, 10, 10, 0.5), { start: 9.5, end: 10 });
});

test('buildCssFilterString produces valid canvas/css filter string', () => {
  const base = buildCssFilterString(DEFAULT_PHOTO_ADJUSTMENTS);
  assert.equal(base, 'brightness(100%) contrast(100%) saturate(100%)');

  const graded = buildCssFilterString({
    ...DEFAULT_PHOTO_ADJUSTMENTS,
    brightness: 112,
    warmth: 25,
    blur: 2,
  });
  assert.equal(
    graded,
    'brightness(112%) contrast(100%) saturate(100%) sepia(25%) blur(2px)'
  );
});

test('wrapTextLines and splitScenesFromPrompt handle empty and multi-scene input', () => {
  assert.deepEqual(wrapTextLines(''), ['AKOOL Local Studio']);
  const wrapped = wrapTextLines('Cinema lighting across obsidian horizon', 18);
  assert.ok(wrapped.length >= 2);

  const scenes = splitScenesFromPrompt('Sunrise over city. Neon rain at midnight. Studio title.');
  assert.equal(scenes.length, 3);
});

test('computeAspectDimensions returns even dimensions for encoders', () => {
  const wide = computeAspectDimensions('16:9', 960);
  assert.equal(wide.width % 2, 0);
  assert.equal(wide.height % 2, 0);
  assert.equal(wide.width, 960);
  assert.equal(wide.height, 540);

  const vert = computeAspectDimensions('9:16', 960);
  assert.equal(vert.width % 2, 0);
  assert.equal(vert.height % 2, 0);
  assert.ok(vert.height > vert.width);

  const sq = computeAspectDimensions('1:1', 960);
  assert.equal(sq.width, sq.height);
});
