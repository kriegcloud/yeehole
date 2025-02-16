/**
 * @since 1.0.0
 */
import * as Effect from "effect/Effect";

/**
 * @since 1.0.0
 */
export type Result<T, E> = Result.Ok<T> | Result.Err<E>;

/**
 * @since 1.0.0
 */
export namespace Result {
  /**
   * @since 1.0.0
   */
  export type Ok<T> = { _tag: "ok"; value: T };
  /**
   * @since 1.0.0
   */
  export type Err<E> = { _tag: "error"; error: E };
  /**
   * @since 1.0.0
   */
  export function ok<T>(value: T): Ok<T> {
    return {_tag: "ok", value};
  }
  /**
   * @since 1.0.0
   */
  export function error<E>(error: E): Err<E> {
    return {_tag: "error", error};
  }
  /**
   * @since 1.0.0
   */
  export function succeedError<E>(e: E) {
    return Effect.succeed(error(e));
  }
  /**
   * @since 1.0.0
   */
  export function isOk<T>(result: Result<T, unknown>): result is Ok<T> {
    return result._tag === "ok";
  }
  /**
   * @since 1.0.0
   */
  export function isErr<E>(result: Result<unknown, E>): result is Err<E> {
    return result._tag === "error";
  }
  /**
   * @since 1.0.0
   */
  export function match<T, E, Ok, Err>({
                                         onOk,
                                         onError,
                                       }: {
    onOk: (value: T) => Ok;
    onError: (error: E) => Err;
  }) {
    return (result: Result<T, E>): Ok | Err => {
      if (isOk(result)) {
        return onOk(result.value);
      }

      return onError(result.error);
    };
  }
}