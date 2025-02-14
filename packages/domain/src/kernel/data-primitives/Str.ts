import * as B from "effect/Brand";
import * as S from "effect/Schema";
import * as JSONSchema from "effect/JSONSchema";

/**
 * @since 0.1.0
 * @category Data Primitives
 */
export namespace Str {
  export const StrTypeId: unique symbol = Symbol.for("@ye/domain/kernel/data-primitives/Str");
  export type StrTypeId = typeof StrTypeId;

  export type StrBrand = string & B.Brand<StrTypeId>;
  export const StrBrand = B.nominal<StrBrand>();

  export const Str = S.String.pipe(S.fromBrand(StrBrand));
  export type Str = typeof Str.Type;

  export const make = <A extends S.String, I, R>(schema: ) => S.String.pipe;
}

export namespace Num {
  export const NumTypeId: unique symbol = Symbol("@ye/domain/kernel/data-primitives/Num");
  export type NumTypeId = typeof NumTypeId;

  export type NumBrand = number & B.Brand<NumTypeId>;
  export const NumBrand = B.nominal<NumBrand>();

  export const Num = S.Number.pipe(S.fromBrand(NumBrand));
  export type Num = typeof Num.Type;

  export const JsonSchema = JSONSchema.make(Num);
}

export namespace Bool {
  export const BoolTypeId: unique symbol = Symbol("@ye/domain/kernel/data-primitives/Bool");
  export type BoolTypeId = typeof BoolTypeId;

  export type BoolBrand = boolean & B.Brand<BoolTypeId>;
  export const BoolBrand = B.nominal<BoolBrand>();

  export const Bool = S.Boolean.pipe(S.fromBrand(BoolBrand));
  export type Bool = typeof Bool.Type;

  export const JsonSchema = JSONSchema.make(Bool);
}

