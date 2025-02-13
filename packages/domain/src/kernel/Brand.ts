
import * as S from "effect/Schema"
import {Brand} from "effect";

export type KernelEntityTypeId = Brand.Branded<string, "@ye/domain/kernel/KernelEntityTypeId">
export const KernelEntityTypeId = Brand.refined<KernelEntityTypeId>((x): x is KernelEntityTypeId =>
  x.startsWith("@ye/domain/kernel/"), (x) => Brand.error(`Expected ${x} to be a KernelEntityTypeId`))

export const KernelEntityId = S.String.pipe(S.fromBrand(KernelEntityTypeId))

export type StrTypeId = Brand.Branded<string, "@ye/domain/kernel/types/StrTypeId">
export const StrTypeId = Brand.refined<StrTypeId>((x): x is StrTypeId =>
  x.startsWith("@ye/domain/kernel/types/"), (x) => Brand.error(`Expected ${x} to be a StrTypeId`))

export const Str = S.String.pipe(S.fromBrand(Brand.all(StrTypeId, KernelEntityTypeId)))



