import * as Array from "effect/Array";
import * as F from "effect/Function";
import * as String from "effect/String"
export const makeEnum = <T extends string>(
  keys: Array.NonEmptyReadonlyArray<T>
): { [K in Uppercase<T>]: Lowercase<T> } =>
  F.pipe(
    keys,
    // Using reduce in a functional style to build the object immutably:
    (keys) =>
      keys.reduce(
        (acc, key) => ({...acc, [String.toUpperCase(key)]: key}),
        {} as { [K in Uppercase<T>]: Lowercase<T> }
      )
  );