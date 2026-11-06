export interface PageRequest {
  readonly cursor: string | undefined;
  readonly limit: number;
}

export interface Page<Item> {
  readonly items: readonly Item[];
  readonly nextCursor: string | undefined;
}

export const MAXIMUM_PAGE_LIMIT = 100;
export const DEFAULT_PAGE_LIMIT = 20;
