import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  containsReferencedResponse,
  isAcceptableResponse,
  ResponseCandidate,
} from '../src/response-filter';

const candidate = (string: string, refs: string[] = [], score = 1): ResponseCandidate => ({
  string,
  score,
  refs: refs.map((ref) => ({ string: ref })),
});

test('rejects an exact referenced message', () => {
  assert.equal(containsReferencedResponse(candidate('hello world', ['hello world'])), true);
  assert.equal(isAcceptableResponse(candidate('hello world', ['hello world']), 0), false);
});

test('rejects a response contained at the beginning, middle, or end of a reference', () => {
  assert.equal(containsReferencedResponse(candidate('hello', ['hello world'])), true);
  assert.equal(containsReferencedResponse(candidate('middle', ['a middle phrase'])), true);
  assert.equal(containsReferencedResponse(candidate('world', ['hello world'])), true);
});

test('rejects short responses without a minimum-length exemption', () => {
  assert.equal(containsReferencedResponse(candidate('x', ['text x text'])), true);
  assert.equal(containsReferencedResponse(candidate('a', ['a longer source'])), true);
});

test('accepts a response absent from all references when its score passes', () => {
  assert.equal(isAcceptableResponse(candidate('new response', ['old message'], 0.8), 0.5), true);
});

test('rejects a response below the configured score', () => {
  assert.equal(isAcceptableResponse(candidate('new response', [], 0.4), 0.5), false);
});

test('checks every reference', () => {
  assert.equal(
    containsReferencedResponse(candidate('copied phrase', ['unrelated', 'copied phrase here'])),
    true,
  );
});

test('accepts a passing response when there are no references', () => {
  assert.equal(isAcceptableResponse(candidate('new response'), 1), true);
});

test('uses raw case, whitespace, and punctuation-sensitive matching', () => {
  assert.equal(containsReferencedResponse(candidate('Hello', ['hello world'])), false);
  assert.equal(containsReferencedResponse(candidate('hello  world', ['hello world'])), false);
  assert.equal(containsReferencedResponse(candidate('hello world!', ['hello world'])), false);
});

test('returns a synchronous boolean result', () => {
  const result = isAcceptableResponse(candidate('response', ['source']), 0);
  assert.equal(typeof result, 'boolean');
});
