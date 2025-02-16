export type Brand<
  TInner,
  TBrandName,
  TReservedName extends string = '__brand',
> = { [k in TReservedName]: TBrandName } & { __real: TInner } & TInner;

export type BrandBase<
  TBrand extends Brand<TInner, unknown>,
  TInner = TBrand['__real'],
> = TInner;

export type BrandValidator<TInput, TOutput extends TInput> = (
  x: TInput,
) => asserts x is TOutput;

function makeBrand<
  TBrand extends Brand<TInner, TBrandName, TReservedName>,
  TReservedName extends string = '__brand',
  TInner = TBrand['__real'],
  TBrandName = TBrand[TReservedName],
>(x: TInner, validator?: BrandValidator<TInner, TBrand>): TBrand {
  validator?.(x);
  return x as unknown as TBrand;
}

function fromBrand<
  TBrand extends Brand<TInner, TBrandName, TReservedName>,
  TReservedName extends string = '__brand',
  TInner = TBrand['__real'],
  TBrandName = TBrand[TReservedName],
>(x: TBrand): TInner {
  return x as unknown as TInner;
}

export function brandKit<
  TBrand extends Brand<TInner, TBrandName, TReservedName>,
  TReservedName extends string = '__brand',
  TInner = TBrand['__real'],
  TBrandName = TBrand[TReservedName],
>(validator?: BrandValidator<TInner, TBrand>) {
  return {
    from(b: TBrand) {
      return fromBrand<TBrand, TReservedName, TInner, TBrandName>(b);
    },
    make(x: TInner) {
      return makeBrand<TBrand, TReservedName, TInner, TBrandName>(x, validator);
    },
  } as const;
}