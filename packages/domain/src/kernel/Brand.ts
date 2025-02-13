import * as B from "effect/Brand";
import * as S from "effect/Schema";
import {pipe} from "effect/Function";
import type {Brand} from "effect/Brand";

const makeBrand =
  <A extends Brand.Unbranded<C>, C extends Brand<any>>
  (
    schema: S.Schema<A>
  ) => {
    return pipe(
      B.nominal<C>(),
      (n) => schema.pipe(S.fromBrand<C, A>(n))
    );
  };

const Str = makeBrand<string, B.Brand<"Str">>(S.String);


const decoded = S.decodeUnknownSync(Str)(Str.make("hello"));
