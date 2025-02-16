import * as S from "effect/Schema";

export const FieldOption = S.Struct({
  id: S.NonEmptyTrimmedString,
  label: S.optional(S.String),
});

export const FieldAnnotationBase = S.Struct({
  name: S.NonEmptyTrimmedString,
  htmlType: S.String,
  datatype: S.NonEmptyTrimmedString, // TODO: browser native data types File etc, primitive data types, composite data types
  label: S.NonEmptyTrimmedString,
  required: S.Boolean,
  readOnly: S.Boolean,
  disabled: S.Boolean,
  hidden: S.Boolean,
  scannable: S.Boolean,
  placeholder: S.optional(S.String),
  testId: S.optional(S.String),
  helperText: S.optional(S.String),
  maxLength: S.optional(S.Number),
  minLength: S.optional(S.Number),
  pattern: S.optional(S.String),
});

export const EnumFieldAnnotationBase = S.Struct({
  ...FieldAnnotationBase.fields,
  options: S.Array(FieldOption),
  multiple: S.Boolean,
});





