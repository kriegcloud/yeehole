import * as Array from "effect/Array";
import * as String from "effect/String";

export namespace Enum {
  export const make = <const T extends string>(
    keys: Array.NonEmptyReadonlyArray<T>
  ): Readonly<{ [K in Uppercase<T>]: Lowercase<T> }> => keys.reduce(
    (acc, key) => ({...acc, [String.toUpperCase(key)]: key}),
    {} as Readonly<{ [K in Uppercase<T>]: Lowercase<T> }>,
  );
}

