/**
 * @since 0.1.0
 */
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as F from "effect/Function";
import * as  Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import { Result } from "@ye/domain";
/**
 * @since 0.1.0
 */
export const ClientRuntime = ManagedRuntime.make(Layer.empty);

/**
 * @since 0.1.0
 */
export namespace RQ {
  const makeEffectFromResult = <Ok, Err>(
    resultPromise: () => Promise<Result.Result<Ok, Err>>,
  ): Effect.Effect<Ok, Err | Cause.UnknownException> =>
    Effect.tryPromise(() => resultPromise()).pipe(
      Effect.flatMap(
        Result.Result.match({
          onOk: (value) => Effect.succeed(value),
          onError: (error) => Effect.fail(error),
        }),
      ),
    );
  /**
   * @since 0.1.0
   */
  export const makeQueryFn =
    <Ok, Err>(
      queryFn: () => Promise<Result.Result<Ok, Err>>,
      effectPipeline: (
        effect: Effect.Effect<Ok, Err | Cause.UnknownException>,
      ) => Effect.Effect<Ok, Err | Cause.UnknownException> = F.identity,
    ) =>
      () =>
        makeEffectFromResult(queryFn).pipe(
          effectPipeline,
          ClientRuntime.runPromise,
        );
  /**
   * @since 0.1.0
   */
  export const makeMutationFn = <Ok, Err>(
    mutateFn: () => Promise<Result.Result<Ok, Err>>,
    effectPipeline: (
      effect: Effect.Effect<Ok, Err | Cause.UnknownException>,
    ) => Effect.Effect<Ok, Err | Cause.UnknownException> = F.identity,
  ): Promise<Ok> =>
    makeEffectFromResult(mutateFn).pipe(
      effectPipeline,
      ClientRuntime.runPromise,
    );
}