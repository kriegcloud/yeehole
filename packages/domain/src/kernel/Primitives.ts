/**
 * @category Primitives
 * @since 0.1.0
 */
import Primitive from "#kernel/factories/Primitive.js";
import * as S from "effect/Schema";

/**
 * @category Primitives
 * @since 0.1.0
 */
export namespace Primitives {
  export const Str = Primitive.make(S.String);
  /**
   * @category Primitives
   * @since 0.1.0
   */
  export type Str = typeof Str.Type;

  export const NonEmptyStr = Primitive.make(S.NonEmptyString.annotations(
    {
      arbitrary: () => (fc) => fc.string().filter((s) => s.length > 0),
    }
  ));
  export type NonEmptyStr = typeof NonEmptyStr.Type;

  export const NonEmptyTrimStr = Primitive.make(S.NonEmptyTrimmedString.annotations(
    {
      arbitrary: () => (fc) => fc.string().filter((s) => s.trim().length > 0),
    }
  ));
  export type NonEmptyTrimStr = typeof NonEmptyTrimStr.Type;

  export const Email = Primitive.make(S.Redacted(NonEmptyTrimStr.pipe(S.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))));
  export type Email = typeof Email.Type;

  export const Url = Primitive.make(NonEmptyTrimStr.pipe(S.pattern(/^(http|https):\/\/[^ "]+$/)));
  export type Url = typeof Url.Type;

  export const Num = Primitive.make(S.Number);
  export type Num = typeof Num.Type;

  export const PosNum = Primitive.make(S.Number.pipe(S.positive()));
  export type PosNum = typeof PosNum.Type;

  export const NegNum = Primitive.make(S.Number.pipe(S.negative()));
  export type NegNum = typeof NegNum.Type;

  export const Int = Primitive.make(S.Int);
  export type Int = typeof Int.Type;

  export const PosInt = Primitive.make(S.Int.pipe(S.positive()));
  export type PosInt = typeof PosInt.Type;

  export const NegInt = Primitive.make(S.Int.pipe(S.negative()));
  export type NegInt = typeof NegInt.Type;

  export const Bool = Primitive.make(S.Boolean);
  export type Bool = typeof Bool.Type;

  export const Date = Primitive.make(S.Date);
  export type Date = typeof Date.Type;

  export const UUID = Primitive.make(S.UUID);
  export type UUID = typeof UUID.Type;

  export const Phone = Primitive.make(NonEmptyTrimStr.pipe(S.pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)));
  export type Phone = typeof Phone.Type;

  export const Hex = Primitive.make(NonEmptyTrimStr.pipe(S.pattern(/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6}|[a-fA-F0-9]{4}|[a-fA-F0-9]{8})$/)));
  export type Hex = typeof Hex.Type;

  export const AlphaStr = Primitive.make(NonEmptyTrimStr.pipe(S.pattern(/^[a-zA-Z]+$/)));
  export type AlphaStr = typeof AlphaStr.Type;

  export const AlphaNumStr = Primitive.make(NonEmptyTrimStr.pipe(S.pattern(/^[a-zA-Z0-9]+$/)));
  export type AlphaNumStr = typeof AlphaNumStr.Type;

  export const AlphaNumDashStr = Primitive.make(NonEmptyTrimStr.pipe(S.pattern(/^[a-zA-Z0-9-]+$/)));
  export type AlphaNumDashStr = typeof AlphaNumDashStr.Type;

  export const AlphaNumDashUnderscoreStr = Primitive.make(NonEmptyTrimStr.pipe(S.pattern(/^[a-zA-Z0-9_-]+$/)));
  export type AlphaNumDashUnderscoreStr = typeof AlphaNumDashUnderscoreStr.Type;

  export const AlphaNumDotStr = Primitive.make(NonEmptyTrimStr.pipe(S.pattern(/^[a-zA-Z0-9.]+$/)));
  export type AlphaNumDotStr = typeof AlphaNumDotStr.Type;

  export const SlugStr = Primitive.make(NonEmptyTrimStr.pipe(S.pattern(/^[a-z0-9-]+$/)));
  export type SlugStr = typeof SlugStr.Type;

  export const StrFromBase64Url = Primitive.make(S.StringFromBase64Url);
  export type StrFromBase64Url = typeof StrFromBase64Url.Type;

  export const StrFromBase64 = Primitive.make(S.StringFromBase64);
  export type StrFromBase64 = typeof StrFromBase64.Type;

  export const StrFromHex = Primitive.make(S.StringFromHex);
  export type StrFromHex = typeof StrFromHex.Type;

  export const StrFromUriComponent = Primitive.make(S.StringFromUriComponent);
  export type StrFromUriComponent = typeof StrFromUriComponent.Type;

  export const UpperCaseStr = Primitive.make(NonEmptyTrimStr.pipe(S.pattern(/^[A-Z]+$/)));
  export type UpperCaseStr = typeof UpperCaseStr.Type;

  export const LowerCaseStr = Primitive.make(NonEmptyTrimStr.pipe(
    S.pattern(/^[a-z]+$/),
  ).annotations({
    arbitrary: () => (fc) => fc.string().map((s) => s.toLowerCase()),
  }));
  export type LowerCaseStr = typeof LowerCaseStr.Type;



  export const FileFromSelf = Primitive.make(S.declare(
    (input: unknown): input is File => input instanceof File,
    {
      identifier: "FileFromSelf",
      arbitrary: () => (fc) =>
        fc
          .tuple(fc.string(), fc.string())
          .map(([content, path]) => new File([content], path)),
    }
  ));
  export type FileFromSelf = typeof FileFromSelf.Type;
}