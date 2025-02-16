/**
 * @since 0.1.0
 */
export type Noop = () => void;
/**
 * @since 0.1.0
 */
interface File extends Blob {
  readonly lastModified: number;
  readonly name: string;
}
/**
 * @since 0.1.0
 */
interface FileList {
  readonly length: number;
  item(index: number): File | null;
  [index: number]: File;
}
/**
 * @since 0.1.0
 */
export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;
/**
 * @since 0.1.0
 */
export type BrowserNativeObject = Date | FileList | File;
/**
 * @since 0.1.0
 */
export type EmptyObject = { [K in string | number]: never };
/**
 * @since 0.1.0
 */
export type NonUndefined<T> = T extends undefined ? never : T;
/**
 * @since 0.1.0
 */
export type LiteralUnion<T extends U, U extends Primitive> =
  | T
  | (U & { _?: never });
/**
 * @since 0.1.0
 */
export type ExtractObjects<T> = T extends infer U
  ? U extends object
    ? U
    : never
  : never;
/**
 * @since 0.1.0
 */
export type DeepPartial<T> = T extends BrowserNativeObject
  ? T
  : {
    [K in keyof T]?: ExtractObjects<T[K]> extends never
      ? T[K]
      : DeepPartial<T[K]>;
  };
/**
 * @since 0.1.0
 */
export type DeepPartialSkipArrayKey<T> = T extends
  | BrowserNativeObject
  ? T
  : T extends ReadonlyArray<any>
    ? { [K in keyof T]: DeepPartialSkipArrayKey<T[K]> }
    : { [K in keyof T]?: DeepPartialSkipArrayKey<T[K]> };

/**
 * Checks whether the type is any
 * See {@link https://stackoverflow.com/a/49928360/3406963}
 * @typeParam T - type which may be any
 * ```
 * IsAny<any> = true
 * IsAny<string> = false
 * ```
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Checks whether the type is never
 * @typeParam T - type which may be never
 * ```
 * IsAny<never> = true
 * IsAny<string> = false
 * ```
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Checks whether T1 can be exactly (mutually) assigned to T2
 * @typeParam T1 - type to check
 * @typeParam T2 - type to check against
 * ```
 * IsEqual<string, string> = true
 * IsEqual<'foo', 'foo'> = true
 * IsEqual<string, number> = false
 * IsEqual<string, number> = false
 * IsEqual<string, 'foo'> = false
 * IsEqual<'foo', string> = false
 * IsEqual<'foo' | 'bar', 'foo'> = boolean // 'foo' is assignable, but 'bar' is not (true | false) -> boolean
 * ```
 */
export type IsEqual<T1, T2> = T1 extends T2
  ? (<G>() => G extends T1 ? 1 : 2) extends <G>() => G extends T2 ? 1 : 2
    ? true
    : false
  : false;
/**
 * @since 0.1.0
 */
export type DeepMap<T, TValue> =
  IsAny<T> extends true
    ? any
    : T extends BrowserNativeObject
      ? TValue
      : T extends object
        ? { [K in keyof T]: DeepMap<NonUndefined<T[K]>, TValue> }
        : TValue;
/**
 * @since 0.1.0
 */
export type IsFlatObject<T extends object> =
  Extract<
    Exclude<T[keyof T], Date | FileList>,
    any[] | object
  > extends never
    ? true
    : false;
/**
 * @since 0.1.0
 */
export type Merge<A, B> = {
  [K in keyof A | keyof B]?: K extends keyof A & keyof B
    ? [A[K], B[K]] extends [object, object]
      ? Merge<A[K], B[K]>
      : A[K] | B[K]
    : K extends keyof A
      ? A[K]
      : K extends keyof B
        ? B[K]
        : never;
};


