export type JsonRecord = Readonly<Record<string, unknown>>;

export function isJsonRecord(candidate: unknown): candidate is JsonRecord {
  return typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate);
}

export function recordAt(record: JsonRecord, key: string): JsonRecord | undefined {
  const child = record[key];
  return isJsonRecord(child) ? child : undefined;
}

export function stringsAt(record: JsonRecord, key: string): string[] {
  const child = record[key];
  return Array.isArray(child) ? child.filter((element): element is string => typeof element === 'string') : [];
}
