import { checkedPathKeys } from '../openapi-operations.js';
import type { PathsCheck, PathsFinding } from '../paths-function.js';
import { isParameterSegment, segmentsOf } from '../path-segments.js';

export const pathVerbs: readonly string[] = [
  'approve', 'cancel', 'create', 'delete', 'remove', 'send', 'verify', 'login', 'logout', 'update', 'get', 'fetch',
  'list', 'add', 'edit', 'activate', 'deactivate', 'reset', 'confirm', 'submit',
];

export const callerNames: readonly string[] = [
  'admin', 'backoffice', 'back-office', 'internal', 'public', 'app', 'web', 'mobile', 'frontend', 'client',
];

const kebabCaseSegment = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const camelCaseParameterSegment = /^\{[a-z][a-zA-Z0-9]*\}$/;

type SegmentProblem = (segment: string) => string | undefined;

function segmentCheck(describeProblem: SegmentProblem): PathsCheck {
  return (paths) =>
    checkedPathKeys(paths).flatMap((pathKey): PathsFinding[] =>
      segmentsOf(pathKey).flatMap((segment) => {
        const problem = describeProblem(segment);
        return problem === undefined ? [] : [{ message: `${pathKey}: ${problem}`, pathInPaths: [pathKey] }];
      }),
    );
}

export const kebabCasePaths = segmentCheck((segment) => {
  const pattern = isParameterSegment(segment) ? camelCaseParameterSegment : kebabCaseSegment;
  if (pattern.test(segment)) {
    return undefined;
  }
  return isParameterSegment(segment)
    ? `path parameter "${segment}" must be {camelCase}`
    : `segment "${segment}" must be kebab-case (/ticket-types, not /ticketTypes)`;
});

/** The whole segment or its first word: `/cancel` and `/send-invite` are verbs, `/cancellations` is a noun. */
export const noVerbsInPaths = segmentCheck((segment) => {
  const firstWord = segment.toLowerCase().split('-')[0] ?? '';
  const isVerb = pathVerbs.includes(segment.toLowerCase()) || pathVerbs.includes(firstWord);
  if (!isVerb) {
    return undefined;
  }
  return `segment "${segment}" is a verb; the HTTP method is the verb and the resource is a noun (POST /registrations/{registrationId}/cancellations)`;
});

export const noCallerNamesInPaths = segmentCheck((segment) => {
  if (!callerNames.includes(segment.toLowerCase())) {
    return undefined;
  }
  return `segment "${segment}" names a caller; who can call a route is authorization, not the URL (/admin/events → /events)`;
});
