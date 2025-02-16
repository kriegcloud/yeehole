/**
 * @since 1.0.0
 */
import * as Effect from "effect/Effect";

/**
 * @since 1.0.0
 */
export const makeRepository =
  <
    SE,
    SR,
    A1,
    A2,
    A3,
    E1,
    E2,
    E3,
    E4,
    R1,
    R2,
    R3,
    R4,
    TExtra extends Record<string, any>
  >(
    maker: Effect.Effect<{
      get: (id: string) => Effect.Effect<A1, E1, R1>;
      create: <T>(data: T) => Effect.Effect<A2, E2, R2>;
      update: <T>(id: string, data: T) => Effect.Effect<A3, E3, R3>;
      delete: (id: string) => Effect.Effect<void, E4, R4>
    } & TExtra, SE, SR>) => maker;