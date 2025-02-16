import * as O from "effect/Option";
import * as F from "effect/Function";
import * as AST from "effect/SchemaAST";
import * as S from "effect/Schema";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Match from "effect/Match";
import * as B from "./brand";
import {makeEnum} from "./factories";
import * as JSONSchema from "effect/JSONSchema";
import type {Mutable} from "effect/Types";
import {Ref} from "effect";

/**
 * Metadata injected b y the log transform plugin.
 *
 * Field names are intentionally short to reduce the size of the generated code.
 */
export interface CallMetadata {
  /**
   * File name.
   */
  F: string;

  /**
   * Line number.
   */
  L: number;

  /**
   * Value of `this` at the site of the log call.
   * Will be set to the class instance if the call is inside a method, or to the `globalThis` (`window` or `global`) otherwise.
   */
  S: any | undefined;

  /**
   * A callback that will invoke the provided function with provided arguments.
   * Useful in the browser to force a `console.log` call to have a certain stack-trace.
   */
  C?: (fn: Function, args: any[]) => void;

  /**
   * Source code of the argument list.
   */
  A?: string[];
}

export type InvariantFn = (condition: unknown, message?: string, meta?: CallMetadata) => asserts condition;
/**
 * Asserts that the condition is true.
 *
 * @param condition
 * @param message Optional message. If it starts with "BUG" then the program will break if this invariant fails if the debugger is attached.
 * @param meta
 */
export const invariant: InvariantFn = (
  condition: unknown,
  message?: string,
  meta?: CallMetadata,
): asserts condition => {
  if (condition) {
    return;
  }

  if (message?.startsWith('BUG')) {
    // This invariant is a debug bug-check: break if the debugger is attached.
    debugger;
  }

  let errorMessage = 'invariant violation';

  if (message) {
    errorMessage += `: ${message}`;
  }

  if (meta?.A) {
    errorMessage += ` [${meta.A[0]}]`;
  }

  if (meta?.F) {
    errorMessage += ` at ${getRelativeFilename(meta.F)}:${meta.L}`;
  }

  throw new InvariantViolation(errorMessage);
};

export class InvariantViolation extends Error {
  constructor(message: string) {
    super(message);
    // NOTE: Restores prototype chain (https://stackoverflow.com/a/48342359).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const getRelativeFilename = (filename: string) => {
  // TODO(burdon): Hack uses "packages" as an anchor (pre-parse NX?)
  // Including `packages/` part of the path so that excluded paths (e.g. from dist) are clickable in vscode.
  const match = filename.match(/.+\/(packages\/.+\/.+)/);
  if (match) {
    const [, filePath] = match;
    return filePath;
  }

  return filename;
};

export const failedInvariant = (message1?: unknown, message2?: string, meta?: CallMetadata): never => {
  let errorMessage = 'invariant violation';

  const message = [message1, message2].filter((str) => typeof str === 'string').join(' ');

  if (message) {
    errorMessage += `: ${message}`;
  }

  if (meta?.A) {
    errorMessage += ` [${meta.A[0]}]`;
  }

  if (meta?.F) {
    errorMessage += ` at ${getRelativeFilename(meta.F)}:${meta.L}`;
  }

  throw new InvariantViolation(errorMessage);
};
// TODO(burdon): Change to Buffer (same as key)?
export type ObjectId = string;

/**
 * DXN unambiguously names a resource like an ECHO object, schema definition, plugin, etc.
 * Each DXN starts with a dx prefix, followed by a resource kind.
 * Colon Symbol : is used a delimiter between parts.
 * DXNs may contain slashes.
 * '@' in the place of the space id is used to denote that the DXN should be resolved in the local space.
 *
 * @example
 *
 * ```
 * dx:echo:<space key>:<echo id>
 * dx:echo:BA25QRC2FEWCSAMRP4RZL65LWJ7352CKE:01J00J9B45YHYSGZQTQMSKMGJ6
 * dx:echo:@:01J00J9B45YHYSGZQTQMSKMGJ6
 * dx:type:dxos.org/type/Calendar
 * dx:plugin:dxos.org/agent/plugin/functions
 * ```
 */
export class DXN {
  /**
   * Kind constants.
   */
  static kind = Object.freeze({
    ECHO: 'echo',
    TYPE: 'type',
  });

  static parse(dxn: string): DXN {
    const [prefix, kind, ...parts] = dxn.split(':');
    if (!(prefix === 'dxn')) {
      throw new Error('Invalid DXN');
    }
    if (!(typeof kind === 'string' && kind.length > 0)) {
      throw new Error('Invalid DXN');
    }
    if (!(parts.length > 0)) {
      throw new Error('Invalid DXN');
    }
    return new DXN(kind, parts);
  }

  #kind: string;
  #parts: string[];

  constructor(kind: string, parts: string[]) {
    invariant(parts.length > 0);
    invariant(parts.every((part) => typeof part === 'string' && part.length > 0 && part.indexOf(':') === -1));

    // Per-type validation.
    switch (kind) {
      case DXN.kind.ECHO:
        invariant(parts.length === 2);
        break;
      case DXN.kind.TYPE:
        invariant(parts.length === 1);
        break;
    }

    this.#kind = kind;
    this.#parts = parts;
  }

  get kind() {
    return this.#kind;
  }

  get parts() {
    return this.#parts;
  }

  isTypeDXNOf(typename: string) {
    return this.#kind === DXN.kind.TYPE && this.#parts.length === 1 && this.#parts[0] === typename;
  }

  toString() {
    return `dxn:${this.#kind}:${this.#parts.join(':')}`;
  }
}

/**
 * Tags for ECHO DXNs that should resolve the object ID in the local space.
 */
export const LOCAL_SPACE_TAG = '@';

export const FieldMetaAnnotationId = Symbol.for('@dxos/schema/annotation/FieldMeta');
export type FieldMetaValue = Record<string, string | number | boolean | undefined>;
/**
 * Echo object metadata.
 */
export type ObjectMeta = {
  /**
   * Foreign keys.
   */
  // keys: ForeignKey[];
};

/**
 * Reactive object proxy.
 */
export interface ReactiveHandler<T extends {}> extends ProxyHandler<T> {
  /**
   * Target to Proxy mapping.
   */
  readonly _proxyMap: WeakMap<object, any>;


  /**
   * Called when a proxy is created for this target.
   */
  init(target: T): void;


  isDeleted(target: T): boolean;


  getSchema(target: T): S.Schema<any> | undefined;


  /**
   * We always store a type reference together with an object, but schema might not have been
   * registered or replicated yet.
   */
  getTypeReference(target: T): Reference | undefined;


  getMeta(target: T): ObjectMeta;
}

/**
 * Passed as the handler to the Proxy constructor.
 * Maintains a mutable slot for the actual handler.
 */
class ProxyHandlerSlot<T extends object> implements ProxyHandler<T> {
  public handler?: ReactiveHandler<T> = undefined;
  public target?: T = undefined;

  get(target: T, prop: string | symbol, receiver: any): any {
    if (prop === symbolIsProxy) {
      return this;
    }

    if (!this.handler || !this.handler.get) {
      return Reflect.get(target, prop, receiver);
    }

    return this.handler.get(target, prop, receiver);
  }

  static {
    const TRAPS: (keyof ProxyHandler<any>)[] = [
      'apply',
      'construct',
      'defineProperty',
      'deleteProperty',
      'get',
      'getOwnPropertyDescriptor',
      'getPrototypeOf',
      'has',
      'isExtensible',
      'ownKeys',
      'preventExtensions',
      'set',
      'setPrototypeOf',
    ];

    for (const trap of TRAPS) {
      if (trap === 'get') {
        continue;
      }

      Object.defineProperty(this.prototype, trap, {
        enumerable: false,
        value: function (this: ProxyHandlerSlot<any>, ...args: any[]) {
          // log.info('trap', { trap, args });
          if (!this.handler || !this.handler[trap]) {
            return (Reflect[trap] as Function)(...args);
          }

          return (this.handler[trap] as Function).apply(this.handler, args);
        },
      });
    }
  }
}

export const getProxyHandlerSlot = <T extends object>(proxy: ReactiveObject<any>): ProxyHandlerSlot<T> => {
  const value = (proxy as any)[symbolIsProxy];
  invariant(value instanceof ProxyHandlerSlot);
  return value;
};
/**
 * Returns the schema for the given object if one is defined.
 */
export const getSchema = <T extends {} = any>(obj: T | undefined): S.Schema<any> | undefined => {
  if (obj == null) {
    return undefined;
  }
  if (isReactiveObject(obj)) {
    const proxyHandlerSlot = getProxyHandlerSlot(obj);
    return proxyHandlerSlot.handler?.getSchema(obj);
  }

  return undefined;
};

/**
 * Runtime representation of object reference.
 */
export class Reference {
  /**
   * Protocol references to runtime registered types.
   */
  static TYPE_PROTOCOL = 'protobuf';

  // static fromValue(value: ReferenceProto): Reference {
  //   return new Reference(value.objectId, value.protocol, value.host);
  // }

  /**
   * @deprecated
   */
  // TODO(burdon): Document/remove?


  static fromDXN(dxn: DXN): Reference {

    if (dxn.kind !== DXN.kind.ECHO) {
      throw new Error(`Unsupported DXN kind: ${dxn.kind}`)
    }
    if (dxn.parts[0] === LOCAL_SPACE_TAG) {
      return new Reference(dxn.parts[1]);
    } else {
      return new Reference(dxn.parts[1], undefined, dxn.parts[0]);
    }
  }

  // prettier-ignore
  constructor(
    public readonly objectId: ObjectId,
    public readonly protocol?: string,
    public readonly host?: string
  ) {
  }

  // encode(): ReferenceProto {
  //   return { objectId: this.objectId, host: this.host, protocol: this.protocol };
  // }

  toDXN(): DXN {
    if (this.protocol === Reference.TYPE_PROTOCOL) {
      return new DXN(DXN.kind.TYPE, [this.objectId]);
    } else {
      if (this.host) {
        // Host is assumed to be the space key.
        // The DXN should actually have the space ID.
        // TODO(dmaretskyi): Migrate to space id.
        return new DXN(DXN.kind.ECHO, [this.host, this.objectId]);
      } else {
        return new DXN(DXN.kind.ECHO, [LOCAL_SPACE_TAG, this.objectId]);
      }
    }
  }
}

export const getTypeReference = (schema: S.Schema<any> | undefined): Reference | undefined => {
  if (!schema) {
    return undefined;
  }
  const annotation = getEchoObjectAnnotation(schema);
  if (annotation == null) {
    return undefined;
  }
  if (annotation.schemaId) {
    return new Reference(annotation.schemaId);
  }

  return undefined
};

type TypedObjectOptions = {
  partial?: true;
  record?: true;
};

/**
 * Marker interface for typed objects (for type inference).
 */
export interface AbstractTypedObject<Fields> extends S.Schema<Fields> {
  // Type constructor.
  new(): Fields;


  // Fully qualified type name.
  readonly typename: string;
}

/**
 * Base class factory for typed objects.
 */
// TODO(burdon): Rename ObjectType.
export const TypedObject = <Klass>(args: EchoObjectAnnotation) => {
  invariant(
    typeof args.typename === 'string' && args.typename.length > 0 && !args.typename.includes(':'),
    'Invalid typename.',
  );

  return <
    Options extends TypedObjectOptions,
    SchemaFields extends S.Struct.Fields,
    SimplifiedFields = Options['partial'] extends boolean
      ? S.SimplifyMutable<Partial<S.Struct.Type<SchemaFields>>>
      : S.SimplifyMutable<S.Struct.Type<SchemaFields>>,
    Fields = SimplifiedFields & { id: string } & (Options['record'] extends boolean
      ? S.SimplifyMutable<S.IndexSignature.Type<S.IndexSignature.Records>>
      : {}),
  >(
    fields: SchemaFields,
    options?: Options,
  ): AbstractTypedObject<Fields> => {
    const fieldsSchema = options?.record ? S.Struct(fields, {key: S.String, value: S.Any}) : S.Struct(fields);
    const schemaWithModifiers = S.mutable(options?.partial ? S.partial(S.asSchema(fieldsSchema)) : fieldsSchema);
    const typeSchema = S.extend(schemaWithModifiers, S.Struct({id: S.String}));
    const annotatedSchema = typeSchema.annotations({
      [EchoObjectAnnotationId]: {typename: args.typename, version: args.version},
    });

    return class {
      static readonly typename = args.typename;

      static [Symbol.hasInstance](obj: unknown): obj is Klass {
        return obj != null && getTypeReference(getSchema(obj))?.objectId === args.typename;
      }

      static readonly ast = annotatedSchema.ast;
      static readonly [S.TypeId] = schemaVariance;
      static readonly annotations = annotatedSchema.annotations.bind(annotatedSchema);
      static readonly pipe = annotatedSchema.pipe.bind(annotatedSchema);

      private constructor() {
        throw new Error('Use create(MyClass, fields) to instantiate an object.');
      }
    } as any;
  };
};

export class StoredSchema extends TypedObject({typename: 'dxos.echo.StoredSchema', version: '0.1.0'})({
  typename: S.String,
  version: S.String,
  jsonSchema: S.Any,
}) {
}

export const schemaVariance = {
  _A: (_: any) => _,
  _I: (_: any) => _,
  _R: (_: never) => _,
};
export const getEchoObjectAnnotation = (schema: S.Schema<any>): EchoObjectAnnotation | undefined =>
  F.pipe(
    AST.getAnnotation<EchoObjectAnnotation>(EchoObjectAnnotationId)(schema.ast),
    O.getOrElse(() => undefined),
  );

// TODO(burdon): Rename getTypename.
export const getEchoObjectTypename = (schema: S.Schema<any>): string | undefined =>
  getEchoObjectAnnotation(schema)?.typename;
// TODO(burdon): AbstractTypedObject?
export const getTypename = <T extends AST.AST>(obj: T): string | undefined => (getType(obj) as AST.AST & { objectId: string })?.objectId;

export interface Identifiable {
  readonly id: string;
}

export interface DynamicSchemaConstructor extends S.Schema<DynamicSchema> {
  new(): Identifiable;
}

// TODO(burdon): Why is this a function?
export const DynamicSchemaBase = (): DynamicSchemaConstructor => {
  return class {
    static get ast() {
      return this._schema.ast;
    }

    static readonly [S.TypeId] = schemaVariance;

    static get annotations() {
      const schema = this._schema;
      return schema.annotations.bind(schema);
    }

    static get pipe() {
      const schema = this._schema;
      return schema.pipe.bind(schema);
    }

    private static get _schema() {
      // The field is DynamicEchoSchema in runtime, but is serialized as StoredEchoSchema in automerge.
      return S.Union(StoredSchema, S.instanceOf(DynamicSchema)).annotations(StoredSchema.ast.annotations);
    }
  } as any;
};

export class DynamicSchema extends DynamicSchemaBase()
implements S.Schema<Identifiable>
{
  public readonly Context!: never;
  private _schema: S.Schema<Identifiable> | undefined;
  private _isDirty = true;

  // TODO(burdon): Rename property.
  constructor(public readonly serializedSchema: StoredSchema) {
    super();
  }

  public override get id() {
    return this.serializedSchema.id;
  }

  public get Type() {
    return this.serializedSchema;
  }

  public get Encoded() {
    return this.serializedSchema;
  }

  public get ast() {
    return this._getSchema().ast;
  }

  public get annotations() {
    const schema = this._getSchema();
    return schema.annotations.bind(schema);
  }

  public get pipe() {
    const schema = this._getSchema();
    return schema.pipe.bind(schema);
  }

  // TODO(burdon): Comment?
  public get [S.TypeId]() {
    return schemaVariance;
  }

  public get schema(): S.Schema<Identifiable> {
    return this._getSchema();
  }

  public get typename(): string {
    return this.serializedSchema.typename;
  }

  // TODO(burdon): Rename.
  invalidate() {
    this._isDirty = true;
  }

  // TODO(burdon): Rename addFields?
  public addColumns(fields: S.Struct.Fields) {
    const oldSchema = this._getSchema();
    const schemaExtension = S.partial(S.Struct(fields));
    const extended = S.extend(oldSchema, schemaExtension).annotations(
      oldSchema.ast.annotations,
    ) as any as S.Schema<Identifiable>;
    this.serializedSchema.jsonSchema = effectToJsonSchema(extended);
  }

  // TODO(burdon): Rename updateFields?
  public updateColumns(fields: S.Struct.Fields) {
    const oldAst = this._getSchema().ast;
    // invariant(AST.isTypeLiteral(oldAst));
    const propertiesToUpdate = (S.partial(S.Struct(fields)).ast as AST.TypeLiteral).propertySignatures;
    const updatedProperties: AST.PropertySignature[] = [...AST.getPropertySignatures(oldAst)];
    for (const property of propertiesToUpdate) {
      const index = updatedProperties.findIndex((p) => p.name === property.name);
      if (index !== -1) {
        updatedProperties.splice(index, 1, property);
      } else {
        updatedProperties.push(property);
      }
    }

    const newAst: any = {...oldAst, propertySignatures: updatedProperties};
    const schemaWithUpdatedColumns = S.make(newAst);
    this.serializedSchema.jsonSchema = effectToJsonSchema(schemaWithUpdatedColumns);
  }

  // TODO(burdon): Rename removeFields?
  public removeColumns(columnsNames: string[]) {
    const oldSchema = this._getSchema();
    const newSchema = S.make(AST.omit(oldSchema.ast, columnsNames)).annotations(oldSchema.ast.annotations);
    this.serializedSchema.jsonSchema = effectToJsonSchema(newSchema);
  }

  public getProperties(): AST.PropertySignature[] {
    const ast = this._getSchema().ast;
    // invariant(AST.isTypeLiteral(ast));
    return [...AST.getPropertySignatures(ast)].filter((p) => p.name !== 'id').map(unwrapOptionality);
  }

  // TODO(burdon): Rename updateProperty?
  public updatePropertyName({before, after}: { before: PropertyKey; after: PropertyKey }) {
    const oldAST = this._getSchema().ast;
    // invariant(AST.isTypeLiteral(oldAST));
    const newAst: any = {
      ...oldAST,
      propertySignatures: AST.getPropertySignatures(oldAST).map((p) => (p.name === before ? {...p, name: after} : p)),
      // oldAST.propertySignatures.map((p) => (p.name === before ? { ...p, name: after } : p)),
    };
    const schemaWithUpdatedColumns = S.make(newAst);
    this.serializedSchema.jsonSchema = effectToJsonSchema(schemaWithUpdatedColumns);
  }

  private _getSchema() {
    if (this._isDirty || this._schema == null) {
      this._schema = jsonToEffectSchema(unwrapProxy(this.serializedSchema.jsonSchema));
      this._isDirty = false;
    }

    return this._schema;
  }
}

const unwrapOptionality = (property: AST.PropertySignature): AST.PropertySignature => {
  if (!AST.isUnion(property.type)) {
    return property;
  }

  return {
    ...property,
    type: property.type.types.find((p) => !AST.isUndefinedKeyword(p))!,
  } as any;
};

const unwrapProxy = (jsonSchema: any): any => {
  if (typeof jsonSchema !== 'object') {
    return jsonSchema;
  }
  if (Array.isArray(jsonSchema)) {
    return jsonSchema.map(unwrapProxy);
  }

  const result: any = {};
  for (const key in jsonSchema) {
    result[key] = unwrapProxy(jsonSchema[key]);
  }

  return result;
};
export const symbolIsProxy = Symbol('isProxy');
export type ReactiveObject<T> = { [K in keyof T]: T[K] };
export const isReactiveObject = (value: unknown): value is ReactiveObject<any> => !!(value as any)?.[symbolIsProxy];
export const EXPANDO_TYPENAME = 'dxos.org/type/Expando';
export const createEchoReferenceSchema = (annotation: EchoObjectAnnotation): S.Schema<any> => {
  const typePredicate =
    annotation.typename === EXPANDO_TYPENAME
      ? () => true
      : (obj: object) => getTypename(obj as AST.AST) === (annotation.schemaId ?? annotation.typename);
  return S.Any.pipe(
    S.filter(
      (obj) => {
        if (obj === undefined) {
          // unresolved reference
          return true;
        }
        if (obj instanceof DynamicSchema) {
          return annotation.typename === StoredSchema.typename;
        }
        return isReactiveObject(obj) && typePredicate(obj);
      },
      {jsonSchema: {}},
    ),
  ).annotations({[ReferenceAnnotationId]: annotation});
};

export const ref = <T extends Identifiable>(schema: S.Schema<T>): S.Schema<Ref.Ref<T>> => {
  const annotation = getEchoObjectAnnotation(schema);
  if (annotation == null) {
    throw new Error('Reference target must be an ECHO object.');
  }
  return createEchoReferenceSchema(annotation);
};

export type FieldMetaAnnotation = {
  [namespace: string]: FieldMetaValue;
};
export const FieldMeta =
  (namespace: string, meta: FieldMetaValue) =>
    <A, I, R>(self: S.Schema<A, I, R>): S.Schema<A, I, R> => {
      const existingMeta = self.ast.annotations[FieldMetaAnnotationId] as FieldMetaAnnotation;
      return self.annotations({
        [FieldMetaAnnotationId]: {
          ...existingMeta,
          [namespace]: {...(existingMeta ?? {})[namespace], ...meta},
        },
      });
    };

export const getFieldMetaAnnotation = <T>(field: AST.PropertySignature, namespace: string) =>
  F.pipe(
    AST.getAnnotation<FieldMetaAnnotation>(FieldMetaAnnotationId)(field.type),
    O.map((meta) => meta[namespace] as T),
    O.getOrElse(() => undefined),
  );
export const EchoObjectAnnotationId = Symbol.for('@dxos/schema/annotation/EchoObject');

export type EchoObjectAnnotation = {
  schemaId?: string;
  typename: string;
  version: string;
};

const ECHO_REFINEMENT_KEY = '$echo';

interface EchoRefinement {
  type?: EchoObjectAnnotation;
  reference?: EchoObjectAnnotation;
  fieldMeta?: FieldMetaAnnotation;
}


export const ReferenceAnnotationId = Symbol.for('@dxos/schema/annotation/Reference');

export type ReferenceAnnotationValue = EchoObjectAnnotation;

export const getReferenceAnnotation = (schema: S.Schema<any>) =>
  F.pipe(
    AST.getAnnotation<ReferenceAnnotationValue>(ReferenceAnnotationId)(schema.ast),
    O.getOrElse(() => undefined),
  );

const annotationToRefinementKey: { [annotation: symbol]: keyof EchoRefinement } = {
  [EchoObjectAnnotationId]: 'type',
  [ReferenceAnnotationId]: 'reference',
  [FieldMetaAnnotationId]: 'fieldMeta',
};

//
// Refs
// https://effect.website/docs/guides/schema
// https://www.npmjs.com/package/@effect/schema
// https://effect-ts.github.io/effect/schema/AST.ts.html
//
/**
 * Get type node.
 */
export const getType = (node: AST.AST): AST.AST | undefined => {
  if (AST.isUnion(node)) {
    return node.types.find((type) => getType(type));
  } else if (AST.isRefinement(node)) {
    return getType(node.from);
  } else {
    return node;
  }
};
//
// Refs
// https://effect.website/docs/schema/introduction
// https://www.npmjs.com/package/@effect/schema
// https://effect-ts.github.io/effect/schema/AST.ts.html
//
// TODO: tuples, unions, refinements, etc, are not supported.
export const Primitive = S.Literal("object", "string", "number", "boolean", "enum", "literal");
export const Primitives = Primitive.literals;
export type PrimitiveType = typeof Primitive.Type;
export const PrimitiveEnum = makeEnum(Primitives);

export class UnsupportedPrimitiveTypeError extends Data.TaggedError("UnsupportedPrimitiveTypeError")<{
  readonly message: string;
}> {
}

export const matchPrimitiveType = (node: AST.AST) => Match.value(node).pipe(
  Match.when(
    (v) => AST.isObjectKeyword(v) || AST.isTypeLiteral(v),
    (_) => "object" as const
  ),
  Match.when(
    (v) => AST.isStringKeyword(v),
    (_) => "string" as const
  ),
  Match.when((v) => AST.isNumberKeyword(v), (_) => "number" as const),
  Match.when((v) => AST.isBooleanKeyword(v), (_) => "boolean" as const),
  Match.when((v) => AST.isEnums(v), (_) => "enum" as const),
  Match.when((v) => AST.isLiteral(v), (_) => "literal" as const),
  Match.orElse(() => undefined)
)

export const getPrimitiveType = (node: AST.AST) =>
  Effect.sync(() => {
    const type = matchPrimitiveType(node)
    if (typeof type === "undefined") {
      return Effect.fail(() => new UnsupportedPrimitiveTypeError({
        message: "Unsupported primitive type",
      }))
    }

    return Effect.succeed(type);
  })

export const isPrimitiveType = (node: AST.AST) => !!getPrimitiveType(node);

//
// Branded types
//
export type JsonPropTypeID = B.Brand<string, {
  __JsonProp: true,
  __JsonPath: false,
}>;
export const JsonPropTypeID = B.brandKit<JsonPropTypeID>()
export type JsonPathTypeID = B.Brand<string, { __JsonPath: true }>
export const JsonPathTypeID = B.brandKit<JsonPathTypeID>()

const PATH_REGEX = /[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*/;
const PROP_REGEX = /\w+/;

export const JsonProp = S.NonEmptyString.pipe(
  S.pattern(PATH_REGEX),
  S.brand(JsonPropTypeID.make("JsonProp"))
);
export type JsonProp = typeof JsonProp.Type;
export const JsonPath = S.NonEmptyString.pipe(
  S.pattern(PROP_REGEX),
  S.brand(JsonPathTypeID.make("JsonPath"))
);
export type JsonPath = typeof JsonPath.Type;

/**
 * Get annotation or return undefined.
 */
// export const getAnnotation =
//   <T>(annotationId: symbol) =>
//     (node: AST.Annotated): T | undefined =>
//       F.pipe(AST.getAnnotation<T>(annotationId)(node), O.getOrUndefined);


/**
 * Get the AST node for the given property (dot-path).
 */
export const getProperty = (schema: S.Schema<any>, path: string): AST.AST | undefined => {
  let node: AST.AST = schema.ast;
  for (const part of path.split('.')) {
    const props = AST.getPropertySignatures(node);
    const prop = props.find((prop) => prop.name === part);
    if (!prop) {
      return undefined;
    }

    // TODO(burdon): Check if leaf.
    const type = getType(prop.type);
    invariant(type, `invalid type: ${path}`);
    node = type;
  }

  return node;
};

export type Visitor = (node: AST.AST, path: string[]) => boolean | void;

/**
 * Visit leaf nodes.
 * Ref: https://www.npmjs.com/package/unist-util-visit#visitor
 */
export const visit = (node: AST.AST, visitor: Visitor) => visitNode(node, visitor);

const visitNode = (node: AST.AST, visitor: Visitor, path: string[] = []) => {
  for (const prop of AST.getPropertySignatures(node)) {
    const currentPath = [...path, prop.name.toString()];
    const type = getType(prop.type);
    if (type) {
      if (AST.isTypeLiteral(type)) {
        visitNode(type, visitor, currentPath);
      } else {
        // NOTE: Only visits leaf nodes.
        const ok = visitor(type, currentPath);
        if (ok === false) {
          return;
        }
      }
    }
  }
};


export const effectToJsonSchema = (schema: S.Schema<any>): any => {
  const withEchoRefinements = (ast: AST.AST): AST.AST => {
    let recursiveResult: AST.AST = ast;
    if (AST.isTypeLiteral(ast)) {
      recursiveResult = {
        ...ast,
        propertySignatures: ast.propertySignatures.map((prop) => ({
          ...prop,
          type: withEchoRefinements(prop.type),
        })),
      } as any;
    } else if (AST.isUnion(ast)) {
      recursiveResult = {...ast, types: ast.types.map(withEchoRefinements)} as any;
    } else if (AST.isTupleType(ast)) {
      recursiveResult = {
        ...ast,
        elements: ast.elements.map((e) => ({...e, type: withEchoRefinements(e.type)})),
        rest: ast.rest.map((e) => withEchoRefinements(e.type)),
      } as any;
    }

    // TOOD: Refinements
    const refinement: EchoRefinement = {};
    for (const annotation of [EchoObjectAnnotationId, ReferenceAnnotationId, FieldMetaAnnotationId]) {
      if (ast.annotations[annotation] != null) {
        refinement[annotationToRefinementKey[annotation]] = ast.annotations[annotation] as any;
      }
    }
    if (Object.keys(refinement).length === 0) {
      return recursiveResult;
    }
    return new AST.Refinement(recursiveResult, () => null as any, {
      [AST.JSONSchemaAnnotationId]: {[ECHO_REFINEMENT_KEY]: refinement},
    });
  };

  const schemaWithRefinements = S.make(withEchoRefinements(schema.ast));
  return JSONSchema.make(schemaWithRefinements);
};


const jsonToEffectTypeSchema = (root: JSONSchema.JsonSchema7Object, defs: JSONSchema.JsonSchema7Root['$defs']): S.Schema<any> => {
  invariant('type' in root && root.type === 'object', `not an object: ${root}`);
  invariant(root.patternProperties == null, 'template literals are not supported');
  const echoRefinement: EchoRefinement = (root as any)[ECHO_REFINEMENT_KEY];
  const fields: S.Struct.Fields = {};
  const propertyList = Object.entries(root.properties ?? {});
  let immutableIdField: S.Schema<any> | undefined;
  for (const [key, value] of propertyList) {
    if (echoRefinement?.type && key === 'id') {
      immutableIdField = jsonToEffectSchema(value, defs);
    } else {
      // TODO(burdon): Mutable cast.
      (fields as any)[key] = root.required.includes(key)
        ? jsonToEffectSchema(value, defs)
        : S.optional(jsonToEffectSchema(value, defs));
    }
  }

  let schemaWithoutEchoId: S.Schema<any, any, unknown>;
  if (typeof root.additionalProperties !== 'object') {
    schemaWithoutEchoId = S.Struct(fields);
  } else {
    const indexValue = jsonToEffectSchema(root.additionalProperties, defs);
    if (propertyList.length > 0) {
      schemaWithoutEchoId = S.Struct(fields, {key: S.String, value: indexValue});
    } else {
      schemaWithoutEchoId = S.Record({
        key: S.String,
        value: indexValue
      });
    }
  }

  if (echoRefinement == null) {
    return schemaWithoutEchoId as any;
  }

  invariant(immutableIdField, 'no id in echo type');
  const schema = S.extend(S.mutable(schemaWithoutEchoId), S.Struct({id: immutableIdField}));
  const annotations: Mutable<S.Annotations.Schema<any>> = {};
  for (const annotation of [EchoObjectAnnotationId, ReferenceAnnotationId, FieldMetaAnnotationId]) {
    if (echoRefinement[annotationToRefinementKey[annotation]]) {
      annotations[annotation] = echoRefinement[annotationToRefinementKey[annotation]];
    }
  }

  return schema.annotations(annotations) as any;
};

const parseJsonSchemaAny = (root: JSONSchema.JsonSchema7Any): S.Schema<any> => {
  const echoRefinement: EchoRefinement = (root as any)[ECHO_REFINEMENT_KEY];
  if (echoRefinement?.reference != null) {
    return createEchoReferenceSchema(echoRefinement.reference);
  }
  return S.Any;
};

export const jsonToEffectSchema = (root: JSONSchema.JsonSchema7Root, definitions?: JSONSchema.JsonSchema7Root['$defs']): S.Schema<any> => {
  const defs = root.$defs ? {...definitions, ...root.$defs} : definitions ?? {};
  if ('type' in root && root.type === 'object') {
    return jsonToEffectTypeSchema(root, defs);
  }

  let result: S.Schema<any> = {} as S.Schema<any>;
  if ('$id' in root) {
    switch (root.$id) {
      case '/schemas/any':
        result = parseJsonSchemaAny(root);
        break;
      case '/schemas/unknown':
        result = S.Unknown;
        break;
      case '/schemas/{}':
      case '/schemas/object':
        result = S.Object;
        break;
    }
  } else if ('const' in root) {
    result = S.Literal(root.const as AST.LiteralValue);
  } else if ('enum' in root) {
    result = S.Union(...root.enum.map((e) => S.Literal(e)));
  } else if ('anyOf' in root) {
    result = S.Union(...root.anyOf.map((v) => jsonToEffectSchema(v, defs)));
  }
  // else if ('$comment' in root && root.$comment === '/schemas/enums') {
  //   result = S.Enums(Object.fromEntries(root.oneOf.map(({title, const: v}) => [title, v])));
  // }
  else if ('type' in root) {
    switch (root.type) {
      case 'string':
        result = S.String;
        break;
      case 'number':
        result = S.Number;
        break;
      case 'integer':
        result = S.Number.pipe(S.int());
        break;
      case 'boolean':
        result = S.Boolean;
        break;
      case 'array':
        if (Array.isArray(root.items)) {
          result = S.Tuple(...root.items.map((v) => jsonToEffectSchema(v, defs)));
        } else {
          invariant(root.items);
          result = S.Array(jsonToEffectSchema(root.items, defs));
        }
        break;
    }
  } else if ('$ref' in root) {
    const refSegments = root.$ref.split('/');
    const jsonSchema = defs[refSegments[refSegments.length - 1]];
    invariant(jsonSchema, `missing definition for ${root.$ref}`);
    result = jsonToEffectSchema(jsonSchema, defs).pipe(S.brand(refSegments[refSegments.length - 1]));
  } else {
    result = S.Unknown;
  }

  const refinement: EchoRefinement | undefined = (root as any)[ECHO_REFINEMENT_KEY];
  return refinement?.fieldMeta ? result.annotations({[FieldMetaAnnotationId]: refinement.fieldMeta}) : result;
};
