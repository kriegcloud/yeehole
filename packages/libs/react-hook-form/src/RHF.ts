/**
 * @since 0.1.0
 */
import * as S from "effect/Schema";
import {useId} from "react";
import type {FieldValues, UseFormProps, UseFormReturn} from "react-hook-form";
import {useForm} from "react-hook-form";
import {effectTsResolver} from "./internal/resolver";
/**
 * @since 0.1.0
 */
export namespace RHF {
  /**
   * @since 0.1.0
   */
  export type UseEffectForm<A extends FieldValues> = UseFormReturn<
    S.Schema.Type<S.Schema<A>>
  > & {
    id: string;
  };
  /**
   * @since 0.1.0
   */
  export type UseEffectFormParams<A extends FieldValues> = Omit<
    UseFormProps<S.Schema.Type<S.Schema<A>>>,
    "resolver"
  > & {
    schema: S.Schema<A>;
  };
  /**
   * @since 0.1.0
   */
  export const useEffectForm = <A extends FieldValues>(
    {
      schema,
      ...rest
    }: UseEffectFormParams<A>) => {
    const form = useForm<S.Schema.Type<S.Schema<A>>>({
      ...rest,
      resolver: effectTsResolver(schema),
    }) as UseEffectForm<A>;

    form.id = useId();

    return form;
  };
  /**
   * @since 0.1.0
   * biome-ignore lint/suspicious/noExplicitAny: <explanation>
   */
  export type AnyEffectForm = UseEffectForm<any>;
}