import {makePrimitive} from "#kernel/factories/index.js";
import * as S from "effect/Schema";

export const Email = makePrimitive(
  S.NonEmptyTrimmedString.pipe(
    S.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
  ))