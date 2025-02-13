import * as B from "effect/Brand";
import * as S from "effect/Schema";
import {pipe} from "effect/Function";
import type {Brand} from "effect/Brand";
import { JSONSchema} from "effect";
import {makeIs} from "#kernel/Is.js";

export const makePrimitive =
  <A extends Brand.Unbranded<C>, C extends Brand<any>>
  (
    schema: S.Schema<A>
  ) => pipe(
    B.nominal<C>(),
    (n) => schema.pipe(S.fromBrand<C, A>(n))
  )


const Str = makePrimitive<string, B.Brand<"Str">>(S.String)
const Num = makePrimitive<number, B.Brand<"Num">>(S.Number);
const Bool = makePrimitive<boolean, B.Brand<"Bool">>(S.Boolean);
const Null = makePrimitive<null, B.Brand<"Null">>(S.Null);


// console.log(JSON.stringify(JSONSchema.make(S.String), null, 2));
const Literals = S.Union(Str, Num, Bool, Null);

export type JsonType =
  | string
  | number
  | boolean
  | {
  [key: string]: JsonType
}
  | JsonType[]
  | readonly JsonType[]
  | null


const decoded = S.decodeUnknownSync(Str)("hello");
const encoded = S.encodeSync(Str)(decoded)
console.log(decoded);
console.log(encoded);


const StrD = makePrimitive<string, B.Brand<"Str">>(S.NonEmptyTrimmedString);

const decoded1 = S.decodeUnknownSync(StrD)("hello");
const decoded2 = S.decodeUnknownSync(StrD)("h1");
//
// const is = makeIs(S.TaggedStruct("BEEP", {
//   value: StrD
// }));
//
// const f = is["BEEP"]
// console.log(f);

type STRTypeId = string & B.Brand<"STRTypeId">
const STRTypeId = B.nominal<STRTypeId>();

const STRfromStr = S.String.pipe(
  S.brand("STRTypeID")
).annotations({
  identifier: "STRfromStr",
});
console.log(JSONSchema.make(STRfromStr))
console.log(S.decodeUnknownSync(STRfromStr)("hello"));