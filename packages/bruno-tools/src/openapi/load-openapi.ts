import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import { OpenApiUnreadable } from '../errors.js';
import { readApiOperations, type ApiOperation } from './api-operation.js';

/** Reads an OpenAPI 3.x document (JSON or YAML) from a file path or an http(s) URL. */
export async function loadApiOperations(source: string): Promise<ApiOperation[]> {
  const text = isUrl(source) ? await fetchText(source) : await readText(source);
  return readApiOperations(parseDocument(source, text));
}

function isUrl(source: string): boolean {
  return /^https?:\/\//i.test(source);
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url).catch((cause: unknown) => {
    throw new OpenApiUnreadable(url, describe(cause));
  });
  if (!response.ok) {
    throw new OpenApiUnreadable(url, `HTTP ${String(response.status)}`);
  }
  return response.text();
}

async function readText(filePath: string): Promise<string> {
  return readFile(filePath, 'utf8').catch((cause: unknown) => {
    throw new OpenApiUnreadable(filePath, describe(cause));
  });
}

function parseDocument(source: string, text: string): unknown {
  try {
    // JSON is a subset of YAML, so one parser reads both.
    return parseYaml(text);
  } catch (cause) {
    throw new OpenApiUnreadable(source, describe(cause));
  }
}

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
