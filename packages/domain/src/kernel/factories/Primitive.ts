import * as S from "effect/Schema";
import {pipe} from "effect/Function";

const make = <A, I, R>(schema: S.Schema<A, I, R>) => pipe(Object.assign(schema, {
  OrUndefined: S.UndefinedOr(schema),
  OrNull: S.NullOr(schema),
  OrNullish: S.NullishOr(schema),
  Optional: S.optional(schema),
  WithDefault: (defaultValue: A) => S.optionalWith(schema, {
    default: () => defaultValue,
  }),
  WithConstructorDefault: (defaultValue: A) => schema.pipe(
    S.propertySignature,
    S.withConstructorDefault(() => defaultValue),
  ),
}));

export default {
  make
};
