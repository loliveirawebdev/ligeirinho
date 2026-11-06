import {
  checkedOperations,
  objectAt,
  responsesOf,
  type OpenApiOperation,
} from '../openapi-operations.js';
import type { PathsCheck, PathsFinding } from '../paths-function.js';
import { isCollectionPath, isItemPathOf } from '../path-segments.js';

const asynchronousOrEmptyStatuses: readonly string[] = ['201', '202', '204'];

function isCollectionPost(openApiOperation: OpenApiOperation): boolean {
  return openApiOperation.method === 'post' && isCollectionPath(openApiOperation.pathKey);
}

function hasReadableItem(collectionPost: OpenApiOperation, operations: readonly OpenApiOperation[]): boolean {
  return operations.some(
    (candidate) => candidate.method === 'get' && isItemPathOf(collectionPost.pathKey, candidate.pathKey),
  );
}

function hasLocationHeader(createdResponse: Record<string, unknown>): boolean {
  const headers = objectAt(createdResponse, 'headers') ?? {};
  return Object.keys(headers).some((headerName) => headerName.toLowerCase() === 'location');
}

/** A POST answering 201 sends `Location` when the created resource is readable (`GET {collection}/{id}`). */
export const createdLocation: PathsCheck = (paths) => {
  const operations = checkedOperations(paths);
  return operations.filter(isCollectionPost).flatMap((collectionPost): PathsFinding[] => {
    const createdResponse = objectAt(responsesOf(collectionPost), '201');
    if (createdResponse === undefined || !hasReadableItem(collectionPost, operations) || hasLocationHeader(createdResponse)) {
      return [];
    }
    return [
      {
        message: `POST ${collectionPost.pathKey}: the 201 response must send a Location header pointing to the created resource`,
        pathInPaths: [collectionPost.pathKey, 'post', 'responses', '201'],
      },
    ];
  });
};

/** A POST on a collection creates: it answers 201 (or 202 / 204 for async or empty creations), never only 200. */
export const createRespondsCreated: PathsCheck = (paths) =>
  checkedOperations(paths)
    .filter(isCollectionPost)
    .flatMap((collectionPost): PathsFinding[] => {
      const statuses = Object.keys(responsesOf(collectionPost));
      const answersCreation = statuses.some((status) => asynchronousOrEmptyStatuses.includes(status));
      if (answersCreation || !statuses.includes('200')) {
        return [];
      }
      return [
        {
          message: `POST ${collectionPost.pathKey}: a creation answers 201 Created, not 200`,
          pathInPaths: [collectionPost.pathKey, 'post', 'responses', '200'],
        },
      ];
    });
