/**
 * @since 0.1.0
 * @category Data Primitives
 */
import {
  Schema as S,
  JSONSchema as JSONSchema,
  Arbitrary as Arbitrary,
  Brand as B,
  SchemaAST as AST,
  pipe,
  flow,
  Record as R,
  Array as Arr,
  Chunk,
} from "effect";

/**
 * @since 0.1.0
 * @category Data Primitives
 */
type TypeInformation<TTypeName extends string> = {
  typeName: TTypeName;
  dataType: "string" | "number" | "boolean" | "object" | "array" | "null";
  typeKind: "primitive" | "reference" | "union" | "intersection" | "tuple";
  arrayElementType?: TypeInformation<TTypeName>;
  enums?: Array<string>;
  properties?: Record<string, TypeInformation<TTypeName>>;
  additionalProperties?: TypeInformation<TTypeName>;
  references?: Array<string>;
  unionTypes?: Array<TypeInformation<TTypeName>>;
  intersectionTypes?: Array<TypeInformation<TTypeName>>;
  tupleElements?: Array<TypeInformation<TTypeName>>;
}

export const YeBrandTypeID = Symbol.for("@ye/domain/kernel/primitives/Brand/YeBrandTypeID");
export type YeBrandTypeID = typeof YeBrandTypeID;

export type Brand<TTypeName extends string> = {
  [YeBrandTypeID]: TypeInformation<TTypeName>
}