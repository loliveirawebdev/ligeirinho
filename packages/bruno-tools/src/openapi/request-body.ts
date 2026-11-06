import { recordAt, stringsAt, type JsonRecord } from './json-record.js';
import { resolveReference } from './schema-reference.js';

export type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'unknown';

export interface BodyProperty {
  readonly name: string;
  readonly schemaType: SchemaType;
  readonly enumValues: readonly unknown[];
}

export interface RequestBodyShape {
  /** Required top-level properties of the JSON body schema (empty when the body is not JSON). */
  readonly requiredProperties: readonly BodyProperty[];
}

interface FlatObjectSchema {
  readonly required: readonly string[];
  readonly properties: JsonRecord;
}

const SCHEMA_TYPES: readonly SchemaType[] = ['string', 'number', 'integer', 'boolean', 'array', 'object'];

export function readRequestBody(document: JsonRecord, requestBody: unknown): RequestBodyShape | undefined {
  const body = resolveReference(document, requestBody);
  if (body === undefined) {
    return undefined;
  }
  const schema = resolveReference(document, jsonSchemaOf(body));
  if (schema === undefined) {
    return { requiredProperties: [] };
  }
  const flatSchema = flattenObjectSchema(document, schema);
  return {
    requiredProperties: flatSchema.required.map((name) =>
      describeProperty(name, resolveReference(document, flatSchema.properties[name])),
    ),
  };
}

function jsonSchemaOf(body: JsonRecord): unknown {
  const content = recordAt(body, 'content');
  if (content === undefined) {
    return undefined;
  }
  const mediaType = 'application/json' in content ? 'application/json' : Object.keys(content).find(isJsonMediaType);
  const media = mediaType === undefined ? undefined : recordAt(content, mediaType);
  return media?.['schema'];
}

function isJsonMediaType(mediaType: string): boolean {
  return /[/+]json\b/i.test(mediaType);
}

/** Merges `allOf` parts so `required` and `properties` from every part count. */
function flattenObjectSchema(document: JsonRecord, schema: JsonRecord): FlatObjectSchema {
  const parts = Array.isArray(schema['allOf']) ? schema['allOf'] : [];
  const flatParts = parts
    .map((part) => resolveReference(document, part))
    .filter((part): part is JsonRecord => part !== undefined)
    .map((part) => flattenObjectSchema(document, part));
  return {
    required: unique([...stringsAt(schema, 'required'), ...flatParts.flatMap((part) => part.required)]),
    properties: Object.fromEntries([
      ...flatParts.flatMap((part) => Object.entries(part.properties)),
      ...Object.entries(recordAt(schema, 'properties') ?? {}),
    ]),
  };
}

function describeProperty(name: string, schema: JsonRecord | undefined): BodyProperty {
  if (schema === undefined) {
    return { name, schemaType: 'unknown', enumValues: [] };
  }
  const enumValues = Array.isArray(schema['enum']) ? schema['enum'] : [];
  return { name, schemaType: schemaTypeOf(schema), enumValues };
}

function schemaTypeOf(schema: JsonRecord): SchemaType {
  const declared = schema['type'];
  // OpenAPI 3.1 allows a list of types, e.g. ["string", "null"].
  const candidates = Array.isArray(declared) ? declared : [declared];
  const known = SCHEMA_TYPES.find((schemaType) => candidates.includes(schemaType));
  if (known !== undefined) {
    return known;
  }
  return 'properties' in schema ? 'object' : 'unknown';
}

function unique(names: readonly string[]): string[] {
  return [...new Set(names)];
}
