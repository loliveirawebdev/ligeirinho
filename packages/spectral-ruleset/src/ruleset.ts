import type { RuleDefinition, RulesetDefinition } from '@stoplight/spectral-core';
import { oas3 } from '@stoplight/spectral-formats';
import { createdLocation, createRespondsCreated } from './checks/creation-checks.js';
import { noSecretsInUrls } from './checks/no-secrets-in-urls.js';
import { paginatedCollections } from './checks/paginated-collections.js';
import { problemDetailsErrors } from './checks/problem-details-errors.js';
import { kebabCasePaths, noCallerNamesInPaths, noVerbsInPaths } from './checks/segment-checks.js';
import { createPathsFunction, type PathsCheck } from './paths-function.js';

function pathsRule(description: string, check: PathsCheck): RuleDefinition {
  return {
    description,
    message: '{{error}}',
    severity: 'error',
    given: '$.paths',
    then: { function: createPathsFunction(check) },
  };
}

/** rules/rest-api.md and rules/scale.md. `/oauth2`, `/health`, `/me` and `/.well-known` are skipped by every rule. */
export const ligeirinhoRuleset = {
  formats: [oas3],
  rules: {
    'ligeirinho-kebab-case-paths': pathsRule('Path segments are kebab-case, path parameters {camelCase}.', kebabCasePaths),
    'ligeirinho-no-verbs-in-paths': pathsRule('No verbs in the path: the HTTP method is the verb.', noVerbsInPaths),
    'ligeirinho-no-caller-names-in-paths': pathsRule(
      'No caller names (admin, web, app…) in the path: who can call is authorization.',
      noCallerNamesInPaths,
    ),
    'ligeirinho-no-secrets-in-urls': pathsRule('No secret-like path or query parameters.', noSecretsInUrls),
    'ligeirinho-created-location': pathsRule(
      'A creation POST answering 201 sends Location when the created resource is readable.',
      createdLocation,
    ),
    'ligeirinho-create-responds-201': pathsRule('A POST on a collection answers 201, not 200.', createRespondsCreated),
    'ligeirinho-paginated-collections': pathsRule('Collection GETs are paginated (cursor or page, and limit).', paginatedCollections),
    'ligeirinho-problem-details-errors': pathsRule('4xx and 5xx responses use application/problem+json.', problemDetailsErrors),
  },
} satisfies RulesetDefinition;

export default ligeirinhoRuleset;
