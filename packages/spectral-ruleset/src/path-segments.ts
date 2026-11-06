export function segmentsOf(pathKey: string): string[] {
  return pathKey.split('/').filter((segment) => segment.length > 0);
}

export function isParameterSegment(segment: string): boolean {
  return segment.startsWith('{') && segment.endsWith('}');
}

/** `/tasks` and `/tasks/{taskId}/comments` are collections; `/tasks/{taskId}` is an item. */
export function isCollectionPath(pathKey: string): boolean {
  const lastSegment = segmentsOf(pathKey).at(-1);
  return lastSegment !== undefined && !isParameterSegment(lastSegment);
}

/** `/tasks/{taskId}` for `/tasks`: the collection path plus exactly one parameter segment. */
export function isItemPathOf(collectionPath: string, candidatePath: string): boolean {
  const collectionSegments = segmentsOf(collectionPath);
  const candidateSegments = segmentsOf(candidatePath);
  const lastCandidateSegment = candidateSegments.pop();
  return (
    lastCandidateSegment !== undefined &&
    isParameterSegment(lastCandidateSegment) &&
    candidateSegments.join('/') === collectionSegments.join('/')
  );
}
