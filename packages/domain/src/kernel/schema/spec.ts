/**
 * @since 0.1.0
 */
import * as S from "effect/Schema";
import * as scheduler_ from "effect/Scheduler";
import * as exit_ from "effect/Exit";
import { ParseResult } from "effect";
import * as Effect from "effect/Effect";
import * as cause_ from "effect/Cause";
/*----------------------------------------------------------------------------------------------------------------------
 |  TITLE: Standard Schema
 *--------------------------------------------------------------------------------------------------------------------*/

/**
 * @since 0.1.0
 * @category Schema
 * @link https://standardschema.dev/
 * @description a common interface designed to be implemented by JavaScript and TypeScript schema libraries.
 */
/** The Standard Schema interface. */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  /** The Standard Schema properties. */
  readonly '~standard': StandardSchemaV1.Props<Input, Output>;
}

export declare namespace StandardSchemaV1 {
  /** The Standard Schema properties interface. */
  export interface Props<Input = unknown, Output = Input> {
    /** The version number of the standard. */
    readonly version: 1;
    /** The vendor name of the schema library. */
    readonly vendor: string;
    /** Validates unknown input values. */
    readonly validate: (
      value: unknown
    ) => Result<Output> | Promise<Result<Output>>;
    /** Inferred types associated with the schema. */
    readonly types?: Types<Input, Output> | undefined;
  }

  /** The result interface of the validate function. */
  export type Result<Output> = SuccessResult<Output> | FailureResult;

  /** The result interface if validation succeeds. */
  export interface SuccessResult<Output> {
    /** The typed output value. */
    readonly value: Output;
    /** The non-existent issues. */
    readonly issues?: undefined;
  }

  /** The result interface if validation fails. */
  export interface FailureResult {
    /** The issues of failed validation. */
    readonly issues: ReadonlyArray<Issue>;
  }

  /** The issue interface of the failure output. */
  export interface Issue {
    /** The error message of the issue. */
    readonly message: string;
    /** The path of the issue, if any. */
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
  }

  /** The path segment interface of the issue. */
  export interface PathSegment {
    /** The key representing a path segment. */
    readonly key: PropertyKey;
  }

  /** The Standard Schema types interface. */
  export interface Types<Input = unknown, Output = Input> {
    /** The input type of the schema. */
    readonly input: Input;
    /** The output type of the schema. */
    readonly output: Output;
  }

  /** Infers the input type of a Standard Schema. */
  export type InferInput<Schema extends StandardSchemaV1> = NonNullable<
    Schema['~standard']['types']
  >['input'];

  /** Infers the output type of a Standard Schema. */
  export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
    Schema['~standard']['types']
  >['output'];
}

export const standardValidate = async <T extends StandardSchemaV1>(schema: T, input: StandardSchemaV1.InferInput<T>): Promise<StandardSchemaV1.InferOutput<T>> => {
  let result = schema['~standard'].validate(input);
  if (result instanceof Promise) result = await result;

  // if the `issues` field exists, the validation failed
  if (result.issues) {
    throw new Error(JSON.stringify(result.issues, null, 2));
  }

  return result.value;
}


const makeStandardResult = <A>(exit: exit_.Exit<StandardSchemaV1.Result<A>>): StandardSchemaV1.Result<A> =>
  exit_.isSuccess(exit) ? exit.value : makeStandardFailureResult(cause_.pretty(exit.cause))

const makeStandardFailureResult = (message: string): StandardSchemaV1.FailureResult => ({
  issues: [{ message }]
})

const makeStandardFailureFromParseIssue = (
  issue: ParseResult.ParseIssue
): Effect.Effect<StandardSchemaV1.FailureResult> =>
  Effect.map(ParseResult.ArrayFormatter.formatIssue(issue), (issues) => ({
    issues: issues.map((issue) => ({
      path: issue.path,
      message: issue.message
    }))
  }))

/**
 * Returns a "Standard Schema" object conforming to the [Standard Schema
 * v1](https://standardschema.dev/) specification.
 *
 * This function creates a schema whose `validate` method attempts to decode and
 * validate the provided input synchronously. If the underlying `Schema`
 * includes any asynchronous components (e.g., asynchronous message resolutions
 * or checks), then validation will necessarily return a `Promise` instead.
 *
 * Any detected defects will be reported via a single issue containing no
 * `path`.
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 *
 * const schema = Schema.Struct({
 *   name: Schema.String
 * })
 *
 * //      ┌─── StandardSchemaV1<{ readonly name: string; }>
 * //      ▼
 * const standardSchema = Schema.standardSchemaV1(schema)
 * ```
 *
 * @category Standard Schema
 * @since 3.13.0
 */
export const standardSchemaV1 = <A, I>(schema: S.Schema<A, I, never>): StandardSchemaV1<I, A> => {
  const decodeUnknown = ParseResult.decodeUnknown(schema)
  return {
    "~standard": {
      version: 1,
      vendor: "effect",
      validate(value) {
        const scheduler = new scheduler_.SyncScheduler()
        const fiber = Effect.runFork(
          Effect.matchEffect(decodeUnknown(value), {
            onFailure: makeStandardFailureFromParseIssue,
            onSuccess: (value) => Effect.succeed({ value })
          }),
          { scheduler }
        )
        scheduler.flush()
        const exit = fiber.unsafePoll()
        if (exit) {
          return makeStandardResult(exit)
        }
        return new Promise((resolve) => {
          fiber.addObserver((exit) => {
            resolve(makeStandardResult(exit))
          })
        })
      }
    }
  }
}

