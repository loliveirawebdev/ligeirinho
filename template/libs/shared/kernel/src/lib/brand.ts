declare const brand: unique symbol;

/** A value the compiler keeps apart from other values of the same primitive type (e.g. TaskId vs UserId). */
export type Brand<Value, Name extends string> = Value & { readonly [brand]: Name };

// The one place a plain value becomes a branded one, so the rest of the code needs no type assertions.
// Callers check the value first (createTaskTitle) or trust its source (a verified token, the database).
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- the parameter is the brand to mark
function markBranded<Branded extends string>(_value: string): asserts _value is Branded {
  // Nothing to do at runtime: the brand only exists for the compiler.
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- the parameter is the brand to create
export function toBranded<Branded extends Brand<string, string>>(value: string): Branded {
  markBranded<Branded>(value);
  return value;
}
