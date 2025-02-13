import {type Schema, type Struct} from "effect/Schema";
import type {Simplify} from "effect/Types";
import * as S from "effect/Schema";
import {type Effect, type ParseResult, pipe, Struct as Struct2, type Types} from "effect";
import type {ParseOptions} from "effect/SchemaAST";
import type {AST} from "#kernel/AST.js";
import type {ClassAnnotations} from "#kernel/EffectTypes.js";
import type {RequiredKeys} from "#kernel/UtilityTypes.js";

export interface Lens<Self, Fields extends Struct.Fields, I, R, C, Inherited, Proto>
  extends Schema<Self, I, R>, PropsExtensions<Fields> {
  new(
    props: RequiredKeys<C> extends never ? Simplify<C> : Simplify<C>,
    disableValidation?: boolean
  ): Struct.Type<Fields> & Omit<Inherited, keyof Fields> & Proto


  readonly fields: Simplify<Fields>

  readonly extend: <Extended = never>(identifier?: string) => <NewFields extends Struct.Fields>(
    newFieldsOr: NewFields | HasFields<NewFields>,
    annotations?: ClassAnnotations<Extended, Struct.Type<Fields & NewFields>>
  ) => [Extended] extends [never] ? MissingSelfGeneric<"Base.extend">
    : Lens<
      Extended,
      Fields & NewFields,
      Simplify<I & Struct.Encoded<NewFields>>,
      R | Struct.Context<NewFields>,
      Simplify<C & S.Struct.Constructor<NewFields>>,
      Self,
      Proto
    >

  readonly transformOrFail: <Transformed = never>(identifier?: string) => <
    NewFields extends Struct.Fields,
    R2,
    R3
  >(
    fields: NewFields,
    options: {
      readonly decode: (
        input: Types.Simplify<Struct.Type<Fields>>,
        options: ParseOptions,
        ast: AST.Transformation
      ) => Effect.Effect<Types.Simplify<Struct.Type<Fields & NewFields>>, ParseResult.ParseIssue, R2>
      readonly encode: (
        input: Types.Simplify<Struct.Type<Fields & NewFields>>,
        options: ParseOptions,
        ast: AST.Transformation
      ) => Effect.Effect<Struct.Type<Fields>, ParseResult.ParseIssue, R3>
    },
    annotations?: ClassAnnotations<Transformed, Struct.Type<Fields & NewFields>>
  ) => [Transformed] extends [never] ? MissingSelfGeneric<"Base.transform">
    : Lens<
      Transformed,
      Fields & NewFields,
      I,
      R | Struct.Context<NewFields> | R2 | R3,
      C & Struct.Constructor<NewFields>,
      Self,
      Proto
    >

  readonly transformOrFailFrom: <Transformed = never>(identifier?: string) => <
    NewFields extends Struct.Fields,
    R2,
    R3
  >(
    fields: NewFields,
    options: {
      readonly decode: (
        input: Types.Simplify<I>,
        options: ParseOptions,
        ast: AST.Transformation
      ) => Effect.Effect<Types.Simplify<I & Struct.Encoded<NewFields>>, ParseResult.ParseIssue, R2>
      readonly encode: (
        input: Types.Simplify<I & Struct.Encoded<NewFields>>,
        options: ParseOptions,
        ast: AST.Transformation
      ) => Effect.Effect<I, ParseResult.ParseIssue, R3>
    },
    annotations?: ClassAnnotations<Transformed, Struct.Type<Fields & NewFields>>
  ) => [Transformed] extends [never] ? MissingSelfGeneric<"Base.transformFrom">
    : Lens<
      Transformed,
      Fields & NewFields,
      I,
      R | Struct.Context<NewFields> | R2 | R3,
      Simplify<C & S.Struct.Constructor<NewFields>>,
      Self,
      Proto
    >
}

type MissingSelfGeneric<Usage extends string, Params extends string = ""> =
  `Missing \`Self\` generic - use \`class Self extends ${Usage}<Self>()(${Params}{ ... })\``

export interface PropsExtensions<Fields> {
  // include: <NewProps extends S.Struct.Fields>(
  //   fnc: (fields: Fields) => NewProps
  // ) => NewProps
  pick: <P extends keyof Fields>(...keys: readonly P[]) => Pick<Fields, P>
  omit: <P extends keyof Fields>(...keys: readonly P[]) => Omit<Fields, P>
}

type HasFields<Fields extends Struct.Fields> = {
  readonly fields: Fields
} | {
  readonly from: HasFields<Fields>
}

// const isPropertySignature = (u: unknown): u is PropertySignature.All =>
//   Predicate.hasProperty(u, PropertySignatureTypeId)

// const isField = (u: unknown) => S.isSchema(u) || S.isPropertySignature(u)

// const isFields = <Fields extends Struct.Fields>(fields: object): fields is Fields =>
//   ownKeys(fields).every((key) => isField((fields as any)[key]))

// const getFields = <Fields extends Struct.Fields>(hasFields: HasFields<Fields>): Fields =>
//   "fields" in hasFields ? hasFields.fields : getFields(hasFields.from)

// const getSchemaFromFieldsOr = <Fields extends Struct.Fields>(fieldsOr: Fields | HasFields<Fields>): Schema.Any =>
//   isFields(fieldsOr) ? Struct(fieldsOr) : S.isSchema(fieldsOr) ? fieldsOr : Struct(getFields(fieldsOr))

// const getFieldsFromFieldsOr = <Fields extends Struct.Fields>(fieldsOr: Fields | HasFields<Fields>): Fields =>
//   isFields(fieldsOr) ? fieldsOr : getFields(fieldsOr)

// export function include<Fields extends S.Struct.Fields>(fields: Fields | HasFields<Fields>) {
//   return <NewProps extends S.Struct.Fields>(
//     fnc: (fields: Fields) => NewProps
//   ) => include_(fields, fnc)
// }

// export function include_<
//   Fields extends S.Struct.Fields,
//   NewProps extends S.Struct.Fields
// >(fields: Fields | HasFields<Fields>, fnc: (fields: Fields) => NewProps) {
//   return fnc("fields" in fields ? fields.fields : fields)
// }

export const Lens: <Self = never>(identifier?: string) => <Fields extends S.Struct.Fields>(
  fieldsOr: Fields | HasFields<Fields>,
  annotations?: ClassAnnotations<Self, Struct.Type<Fields>>
) => [Self] extends [never] ? MissingSelfGeneric<"Class">
  : Lens<
    Self,
    Fields,
    Simplify<Struct.Encoded<Fields>>,
    Struct.Context<Fields>,
    Simplify<S.Struct.Constructor<Fields>>,
    NonNullable<unknown>,
    NonNullable<unknown>
  > = (identifier) => (fields, annotations) => {
  const cls = S.Class as any
  return class extends cls(identifier)(fields, annotations) {
    constructor(a: any, b = true) {
      super(a, b)
    }

    // static readonly include = include(fields)
    static readonly pick = (...selection: any[]) => pipe(fields, Struct2.pick(...selection))
    static readonly omit = (...selection: any[]) => pipe(fields, Struct2.omit(...selection))
  } as any
}

export const TaggedLens: <Self = never>(identifier?: string) => <Tag extends string, Fields extends S.Struct.Fields>(
  tag: Tag,
  fieldsOr: Fields | HasFields<Fields>,
  annotations?: ClassAnnotations<Self, Struct.Type<Fields>>
) => [Self] extends [never] ? MissingSelfGeneric<"Class">
  : Lens<
    Self,
    { readonly _tag: S.tag<Tag> } & Fields,
    Simplify<{ readonly _tag: Tag } & Struct.Encoded<Fields>>,
    Schema.Context<Fields[keyof Fields]>,
    Simplify<S.Struct.Constructor<Fields>>,
    NonNullable<unknown>,
    NonNullable<unknown>
  > = (identifier) => (tag, fields, annotations) => {
  const cls = S.TaggedClass as any
  return class extends cls(identifier)(tag, fields, annotations) {
    constructor(a: any, b = true) {
      super(a, b)
    }

    // static readonly include = include(fields)
    static readonly pick = (...selection: any[]) => pipe(fields, Struct2.pick(...selection))
    static readonly omit = (...selection: any[]) => pipe(fields, Struct2.omit(...selection))
  } as any
}

export const ExtendedLens: <Self, SelfFrom>(identifier?: string) => <Fields extends S.Struct.Fields>(
  fieldsOr: Fields | HasFields<Fields>,
  annotations?: ClassAnnotations<Self, Struct.Type<Fields>>
) => Lens<
  Self,
  Fields,
  SelfFrom,
  Schema.Context<Fields[keyof Fields]>,
  Simplify<S.Struct.Constructor<Fields>>,
  NonNullable<unknown>,
  NonNullable<unknown>
> = Lens as any

export interface EnhancedTaggedLens<Self, Tag extends string, Fields extends Struct.Fields, SelfFrom>
  extends Lens<
    Self,
    Fields,
    SelfFrom,
    Struct.Context<Fields>,
    Struct.Constructor<Omit<Fields, "_tag">>,
    NonNullable<unknown>,
    NonNullable<unknown>
  > {
  readonly _tag: Tag
}

export const ExtendedTaggedLens: <Self, SelfFrom>(
  identifier?: string
) => <Tag extends string, Fields extends S.Struct.Fields>(
  tag: Tag,
  fieldsOr: Fields | HasFields<Fields>,
  annotations?: ClassAnnotations<Self, Struct.Type<Fields>>
) => EnhancedTaggedLens<
  Self,
  Tag,
  { readonly _tag: S.tag<Tag> } & Fields,
  SelfFrom
> = TaggedLens as any


class FHole extends TaggedLens<FHole>("@ye/beep")("FHole", {
  hole: S.String,
}) {
}

const decode = S.decodeUnknownSync(FHole)({hole: "beep"});