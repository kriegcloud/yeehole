import * as S from "effect/Schema"

export type ClassAnnotations<Self, A> =
  | S.Annotations.Schema<Self>
  | readonly [
    S.Annotations.Schema<Self> | undefined,
  S.Annotations.Schema<Self>?,
  S.Annotations.Schema<A>?
]
