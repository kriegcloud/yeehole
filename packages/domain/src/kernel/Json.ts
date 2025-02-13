import * as S from "effect/Schema";
/*----------------------------------------------------------------------------------------------------------------------
 |  TITLE: Data Type primitive for JSON
 *--------------------------------------------------------------------------------------------------------------------*/


const Literal = S.Union(S.String, S.Number, S.Boolean, S.Null)
type JsonType =
  | string
  | number
  | boolean
  | { [key: string]: JsonType }
  | JsonType[]
  | readonly JsonType[]
  | null


export const Json = S.suspend(
  (): S.Schema<JsonType> =>
    S.Union(
      Literal, JSONArray, JSONRecord
    ),
)
export const JSONArray = S.Union(
  S.mutable(S.Array(Json)),
  S.Array(Json)
)

export const JSONRecord = S.Record({key: S.String, value: Json})