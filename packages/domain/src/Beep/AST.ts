import * as O from "effect/Option";
import * as F from "effect/Function";
import * as AST from "effect/SchemaAST";
import * as S from "effect/Schema";
import * as B from "./Brand";
import * as JSONSchema from "effect/JSONSchema";
import type {Mutable} from "effect/Types";
import {Ref} from "effect";
import { invariant } from "./invariant";
// TODO brand this
export type ObjectId = string;

export const FieldMetaAnnotationId = Symbol.for('@moses/schema/annotation/FieldMeta');
export type FieldMetaValue = Record<string, string | number | boolean | undefined>;
/**
 * Moses object metadata.
 */
export type ObjectMeta = {
  /**
   * TODO Foreign keys. or other shib?
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
  static TYPE_PROTOCOL = 'beephole';

  // static fromValue(value: ReferenceProto): Reference {
  //   return new Reference(value.objectId, value.protocol, value.host);
  // }

  // static fromE2N(e2n: E2N): Reference {
  //
  //   if (e2n.kind !== E2N.kind.MOSES) {
  //     throw new Error(`Unsupported E2N kind: ${e2n.kind}`)
  //   }
  //   if (e2n.parts[0] === LOCAL_SPACE_TAG) {
  //     return new Reference(e2n.parts[1]);
  //   } else {
  //     return new Reference(e2n.parts[1], undefined, e2n.parts[0]);
  //   }
  // }

  constructor(
    public readonly objectId: ObjectId,
    // public readonly protocol?: string,
    // public readonly host?: string
  ) {
  }

  // encode(): ReferenceProto {
  //   return { objectId: this.objectId, host: this.host, protocol: this.protocol };
  // }

  // toE2N(): E2N {
  //   if (this.protocol === Reference.TYPE_PROTOCOL) {
  //     return new E2N(E2N.kind.TYPE, [this.objectId]);
  //   } else {
  //     if (this.host) {
  //       // Host is assumed to be the space key.
  //       // The E2N should actually have the space ID.
  //       return new E2N(E2N.kind.MOSES, [this.host, this.objectId]);
  //     } else {
  //       return new E2N(E2N.kind.MOSES, [LOCAL_SPACE_TAG, this.objectId]);
  //     }
  //   }
  // }
}

export const getTypeReference = (schema: S.Schema<any> | undefined): Reference | undefined => {
  if (!schema) {
    return undefined;
  }
  const annotation = getMosesObjectAnnotation(schema);
  if (annotation == null) {
    return undefined;
  }
  if (annotation.schemaId) {
    return new Reference(annotation.schemaId);
  }

  return undefined
};

type ObjectTypeOptions = {
  partial?: true;
  record?: true;
};

/**
 * Marker interface for typed objects (for type inference).
 */
export interface AbstractObjectType<Fields> extends S.Schema<Fields> {
  // Type constructor.
  new(): Fields;


  // Fully qualified type name.
  readonly typename: string;
}

/**
 * Base class factory for typed objects.
 */
export const ObjectType = <Klass>(args: MosesObjectAnnotation) => {
  invariant(
    args.typename.length > 0 && !args.typename.includes(':'),
    'Invalid typename.',
  );

  return <
    Options extends ObjectTypeOptions,
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
  ): AbstractObjectType<Fields> => {
    const fieldsSchema = options?.record ? S.Struct(fields, {key: S.String, value: S.Any}) : S.Struct(fields);
    const schemaWithModifiers = S.mutable(options?.partial ? S.partial(S.asSchema(fieldsSchema)) : fieldsSchema);
    const typeSchema = S.extend(schemaWithModifiers, S.Struct({id: S.String}));
    const annotatedSchema = typeSchema.annotations({
      [MosesObjectAnnotationId]: {typename: args.typename, version: args.version},
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
      // TODO: fix type assertion
    } as any;
  };
};

export class StoredSchema extends ObjectType({typename: 'e2.moses.StoredSchema', version: '0.1.0'})({
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

export const getMosesObjectAnnotation = (schema: S.Schema<any>): MosesObjectAnnotation | undefined =>
  F.pipe(
    AST.getAnnotation<MosesObjectAnnotation>(MosesObjectAnnotationId)(schema.ast),
    O.getOrElse(() => undefined),
  );

export const getTypename = <T extends AST.AST>(obj: T): string | undefined => (getType(obj) as AST.AST & {
  objectId: string
})?.objectId;

export interface Identifiable {
  readonly id: string;
}

export class DynamicSchemaBase {
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
    // The field is DynamicMosesSchema in runtime, but is serialized as StoredMosesSchema in auto-merge.
    return S.Union(StoredSchema, S.instanceOf(DynamicSchema)).annotations(StoredSchema.ast.annotations);
  }
}

export class DynamicSchema extends DynamicSchemaBase
  implements S.Schema<Identifiable> {
  public readonly Context!: never;
  private _schema: S.Schema<Identifiable> | undefined;
  private _isDirty = true;


  constructor(public readonly storedSchema: StoredSchema) {
    super();
  }

  public get id() {
    return this.storedSchema.id;
  }

  public get Type() {
    return this.storedSchema;
  }

  public get Encoded() {
    return this.storedSchema;
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

  public get [S.TypeId]() {
    return schemaVariance;
  }

  public get schema(): S.Schema<Identifiable> {
    return this._getSchema();
  }

  public get typename(): string {
    return this.storedSchema.typename;
  }

  isDirty() {
    this._isDirty = true;
  }

  public addFields(fields: S.Struct.Fields) {
    const oldSchema = this._getSchema();
    const schemaExtension = S.partial(S.Struct(fields));
    const extended = S.extend(oldSchema, schemaExtension).annotations(
      oldSchema.ast.annotations,
    ) as any as S.Schema<Identifiable>;
    this.storedSchema.jsonSchema = effectToJsonSchema(extended);
  }

  public updateFields(fields: S.Struct.Fields) {
    const oldAst = this._getSchema().ast;
    invariant(AST.isTypeLiteral(oldAst));
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
    this.storedSchema.jsonSchema = effectToJsonSchema(schemaWithUpdatedColumns);
  }

  public removeFields(columnsNames: string[]) {
    const oldSchema = this._getSchema();
    const newSchema = S.make(AST.omit(oldSchema.ast, columnsNames)).annotations(oldSchema.ast.annotations);
    this.storedSchema.jsonSchema = effectToJsonSchema(newSchema);
  }

  public getProperties(): AST.PropertySignature[] {
    const ast = this._getSchema().ast;
    invariant(AST.isTypeLiteral(ast));
    return [...AST.getPropertySignatures(ast)].filter((p) => p.name !== 'id').map(unwrapOptionality);
  }

  public updateProperty({before, after}: { before: PropertyKey; after: PropertyKey }) {
    const oldAST = this._getSchema().ast;
    invariant(AST.isTypeLiteral(oldAST));
    const newAst: any = {
      ...oldAST,
      propertySignatures: AST.getPropertySignatures(oldAST).map((p) => (p.name === before ? {...p, name: after} : p)),
    };
    const schemaWithUpdatedColumns = S.make(newAst);
    this.storedSchema.jsonSchema = effectToJsonSchema(schemaWithUpdatedColumns);
  }

  private _getSchema() {
    if (this._isDirty || this._schema == null) {
      this._schema = jsonToEffectSchema(unwrapProxy(this.storedSchema.jsonSchema));
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

export const EXPANDED_TYPENAME = 'e2solutionsinc';

export const createMosesReferenceSchema = (annotation: MosesObjectAnnotation): S.Schema<any> => {
  const typePredicate =
    annotation.typename === EXPANDED_TYPENAME
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
  const annotation = getMosesObjectAnnotation(schema);
  if (annotation == null) {
    throw new Error('Reference target must be an MOSES object.');
  }
  return createMosesReferenceSchema(annotation);
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
export const MosesObjectAnnotationId = Symbol.for('@moses/schema/annotation/MosesObject');

export type MosesObjectAnnotation = {
  schemaId?: string;
  typename: string;
  version: string;
};

const MOSES_REFINEMENT_KEY = '$moses';

interface MosesRefinement {
  type?: MosesObjectAnnotation;
  reference?: MosesObjectAnnotation;
  fieldMeta?: FieldMetaAnnotation;
}


export const ReferenceAnnotationId = Symbol.for('@moses/schema/annotation/Reference');

export type ReferenceAnnotationValue = MosesObjectAnnotation;

export const getReferenceAnnotation = (schema: S.Schema<any>) =>
  F.pipe(
    AST.getAnnotation<ReferenceAnnotationValue>(ReferenceAnnotationId)(schema.ast),
    O.getOrElse(() => undefined),
  );

const annotationToRefinementKey: { [annotation: symbol]: keyof MosesRefinement } = {
  [MosesObjectAnnotationId]: 'type',
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
// export const Primitive = S.Literal("object", "string", "number", "boolean", "enum", "literal");
// export const Primitives = Primitive.literals;
// export type PrimitiveType = typeof Primitive.Type;
// export const PrimitiveEnum = makeEnum(Primitives);
//
// export class UnsupportedPrimitiveTypeError extends Data.TaggedError("UnsupportedPrimitiveTypeError")<{
//   readonly message: string;
// }> {
// }
//
// export const matchPrimitiveType = (node: AST.AST) => Match.value(node).pipe(
//   Match.when(
//     (v) => AST.isObjectKeyword(v) || AST.isTypeLiteral(v),
//     (_) => "object" as const
//   ),
//   Match.when(
//     (v) => AST.isStringKeyword(v),
//     (_) => "string" as const
//   ),
//   Match.when((v) => AST.isNumberKeyword(v), (_) => "number" as const),
//   Match.when((v) => AST.isBooleanKeyword(v), (_) => "boolean" as const),
//   Match.when((v) => AST.isEnums(v), (_) => "enum" as const),
//   Match.when((v) => AST.isLiteral(v), (_) => "literal" as const),
//   Match.orElse(() => undefined)
// )
//
// export const getPrimitiveType = (node: AST.AST) =>
//   Effect.sync(() => {
//     const type = matchPrimitiveType(node)
//     if (typeof type === "undefined") {
//       return Effect.fail(() => new UnsupportedPrimitiveTypeError({
//         message: "Unsupported primitive type",
//       }))
//     }
//
//     return Effect.succeed(type);
//   })
//
// export const isPrimitiveType = (node: AST.AST) => !!getPrimitiveType(node);

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
 * Get the AST node for the given property (dot-path).
 */
export const getProperty = (schema: S.Schema<any>, path: string): AST.AST | undefined => {
  let node: AST.AST = schema.ast;
  const parts = path.split('.');
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const props = AST.getPropertySignatures(node);
    const prop = props.find((prop) => prop.name === part);
    if (!prop) {
      return undefined;
    }

    const type = getType(prop.type);
    invariant(type, `invalid type: ${path}`);

    // If there are still parts left but the current type isn't a container (leaf), then return undefined.
    if (i < parts.length - 1 && !AST.isTypeLiteral(type)) {
      return undefined;
    }

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
  const withMosesRefinements = (ast: AST.AST): AST.AST => {
    let recursiveResult: AST.AST = ast;
    if (AST.isTypeLiteral(ast)) {
      recursiveResult = {
        ...ast,
        propertySignatures: ast.propertySignatures.map((prop) => ({
          ...prop,
          type: withMosesRefinements(prop.type),
        })),
      } as any;
    } else if (AST.isUnion(ast)) {
      recursiveResult = {...ast, types: ast.types.map(withMosesRefinements)} as any;
    } else if (AST.isTupleType(ast)) {
      recursiveResult = {
        ...ast,
        elements: ast.elements.map((e) => ({...e, type: withMosesRefinements(e.type)})),
        rest: ast.rest.map((e) => withMosesRefinements(e.type)),
        // TODO: rest
      } as any;
    }

    const refinement: MosesRefinement = {};
    for (const annotation of [MosesObjectAnnotationId, ReferenceAnnotationId, FieldMetaAnnotationId]) {
      if (ast.annotations[annotation] != null) {
        refinement[annotationToRefinementKey[annotation]] = ast.annotations[annotation] as any;
      }
    }
    if (Object.keys(refinement).length === 0) {
      return recursiveResult;
    }
    return new AST.Refinement(recursiveResult, () => null as any, {
      [AST.JSONSchemaAnnotationId]: {[MOSES_REFINEMENT_KEY]: refinement},
    });
  };

  const schemaWithRefinements = S.make(withMosesRefinements(schema.ast));
  return JSONSchema.make(schemaWithRefinements);
};

const jsonToEffectTypeSchema = (root: JSONSchema.JsonSchema7Object, defs: JSONSchema.JsonSchema7Root['$defs']): S.Schema<any> => {
  invariant('type' in root && root.type === 'object', `not an object: ${root}`);
  invariant(root.patternProperties == null, 'template literals are not supported');
  const mosesRefinement: MosesRefinement = (root as any)[MOSES_REFINEMENT_KEY];
  const fields: Mutable<S.Struct.Fields> = {};
  const propertyList = Object.entries(root.properties ?? {});
  let immutableIdField: S.Schema<any> | undefined;
  for (const [key, value] of propertyList) {
    if (mosesRefinement?.type && key === 'id') {
      immutableIdField = jsonToEffectSchema(value, defs);
    } else {
      fields[key] = root.required.includes(key)
        ? jsonToEffectSchema(value, defs)
        : S.optional(jsonToEffectSchema(value, defs));
    }
  }

  let schemaWithoutMosesId: S.Schema<any, any, unknown>;
  if (typeof root.additionalProperties !== 'object') {
    schemaWithoutMosesId = S.Struct(fields);
  } else {
    const indexValue = jsonToEffectSchema(root.additionalProperties, defs);
    if (propertyList.length > 0) {
      schemaWithoutMosesId = S.Struct(fields, {key: S.String, value: indexValue});
    } else {
      schemaWithoutMosesId = S.Record({
        key: S.String,
        value: indexValue
      });
    }
  }

  if (mosesRefinement == null) {
    return schemaWithoutMosesId as any;
  }

  invariant(immutableIdField, 'no id in moses type');
  const schema = S.extend(S.mutable(schemaWithoutMosesId), S.Struct({id: immutableIdField}));
  const annotations: Mutable<S.Annotations.Schema<any>> = {};
  for (const annotation of [MosesObjectAnnotationId, ReferenceAnnotationId, FieldMetaAnnotationId]) {
    if (mosesRefinement[annotationToRefinementKey[annotation]]) {
      annotations[annotation] = mosesRefinement[annotationToRefinementKey[annotation]];
    }
  }

  return schema.annotations(annotations) as any;
};

const parseJsonSchemaAny = (root: JSONSchema.JsonSchema7Any): S.Schema<any> => {
  const mosesRefinement: MosesRefinement = (root as any)[MOSES_REFINEMENT_KEY];
  if (mosesRefinement?.reference != null) {
    return createMosesReferenceSchema(mosesRefinement.reference);
  }
  return S.Any;
};

// TODO use match and pipe
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
  } else if ('type' in root) {
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
// TODO: make refinement typesafe
  const refinement: MosesRefinement | undefined = (root as any)[MOSES_REFINEMENT_KEY];
  return refinement?.fieldMeta ? result.annotations({[FieldMetaAnnotationId]: refinement.fieldMeta}) : result;
};
