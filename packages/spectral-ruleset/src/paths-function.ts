import { createRulesetFunction, type IFunctionResult, type RulesetFunctionWithValidator } from '@stoplight/spectral-core';

/** A problem found in the `paths` object, with its location relative to `paths`. */
export interface PathsFinding {
  readonly message: string;
  readonly pathInPaths: readonly (string | number)[];
}

export type PathsCheck = (paths: unknown) => PathsFinding[];

/** Turns a check over the whole `paths` object into a Spectral function, for rules with `given: $.paths`. */
export function createPathsFunction(check: PathsCheck): RulesetFunctionWithValidator<unknown, null> {
  return createRulesetFunction<unknown, null>({ input: null, options: null }, (paths, _options, context) =>
    check(paths).map(
      (finding): IFunctionResult => ({ message: finding.message, path: [...context.path, ...finding.pathInPaths] }),
    ),
  );
}
