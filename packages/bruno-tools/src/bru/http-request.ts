import { MissingMethodBlock } from '../errors.js';
import { HTTP_METHODS, type HttpMethod } from '../http-method.js';
import { findBlock, findEntryValue, type BruDocument } from './bru-document.js';

export interface BruHttpRequest {
  readonly name: string;
  readonly method: HttpMethod;
  readonly url: string;
  /** Value of `body:` in the method block, `none` when absent. */
  readonly bodyMode: string;
  /** Value of `auth:` in the method block, `none` when absent. */
  readonly authMode: string;
  /** Content of the `body:json` block, when there is one. */
  readonly jsonBody: string | undefined;
}

export function readHttpRequest(document: BruDocument): BruHttpRequest {
  const method = HTTP_METHODS.find((candidate) => findBlock(document, candidate) !== undefined);
  if (method === undefined) {
    throw new MissingMethodBlock();
  }
  const methodBlock = findBlock(document, method);
  const jsonBlock = findBlock(document, 'body:json');
  return {
    name: findEntryValue(findBlock(document, 'meta'), 'name') ?? '',
    method,
    url: findEntryValue(methodBlock, 'url') ?? '',
    bodyMode: findEntryValue(methodBlock, 'body') ?? 'none',
    authMode: findEntryValue(methodBlock, 'auth') ?? 'none',
    jsonBody: jsonBlock?.kind === 'text' ? jsonBlock.content : undefined,
  };
}
