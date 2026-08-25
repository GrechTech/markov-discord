export interface ResponseCandidate {
  string: string;
  score: number;
  refs: Array<{ string: string }>;
}

/**
 * Returns true when the generated response is copied from a referenced input.
 * Matching is intentionally raw, case-sensitive, and substring-based.
 */
export function containsReferencedResponse(result: ResponseCandidate): boolean {
  return result.refs.some((ref) => ref.string.includes(result.string));
}

export function isAcceptableResponse(result: ResponseCandidate, minScore: number): boolean {
  return result.score >= minScore && !containsReferencedResponse(result);
}
