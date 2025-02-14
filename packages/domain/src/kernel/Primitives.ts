/**
 * @category Primitives
 * @since 0.1.0
 */
import * as Ctx from "effect/Context";
import * as S from "effect/Schema";
import * as B from "effect/Brand";
// import * as Effect from "effect/Effect";
// import type { EnumsDefinition } from "effect/Schema";

/**
 * @category Primitives
 * @since 0.1.0
 */
const f = "@ye/domain/kernel/data-primitives/StrTypeId" as const;

export const StrTypeId: unique symbol = Symbol.for(f);
export type StrTypeId = typeof StrTypeId;

export type YeStrBrand = string & B.Brand<StrTypeId>;
export const YeStrBrand = B.nominal<YeStrBrand>()

