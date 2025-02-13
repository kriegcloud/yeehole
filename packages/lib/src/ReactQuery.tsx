/**
 * @since 0.1.0
 * @category react-query
 */
import React, { createContext, useContext, useMemo, useState } from "react";
import { QueryClient as RQQueryClient } from "@tanstack/react-query";
import * as Context from "effect/Context";
import * as FiberRefs from "effect/FiberRefs";
import * as Runtime from "effect/Runtime";
// import * as B from "effect/Brand";

/**
 * @since 0.1.0
 * @category react-query
 */


export class QueryClient extends Context.Tag("QueryClient")<QueryClient, RQQueryClient>() {}

/**
 * @since 0.1.0
 * @category react-query
 */
export type ClientServices = QueryClient;

/**
 * @since 0.1.0
 * @category react-query
 */
const EffectRuntimeCtx = createContext<Runtime.Runtime<ClientServices> | null>(null);

/**
 * @since 0.1.0
 * @category react-query
 */
const EffectCtxContent = createContext<Runtime.Runtime<ClientServices> | null>(null);

/**
 * @since 0.1.0
 * @category react-query
 */
export const useEffectRuntime = () => {
  const runtime = useContext(EffectRuntimeCtx);
  if (!runtime) {
    throw new Error("useEffectRuntime must be used within an EffectRuntimeProvider");
  }
  return runtime;
}

/**
 * @since 0.1.0
 * @category react-query
 */
export const useEffectCtx = () => {
  const context = useContext(EffectCtxContent);
  if (!context) {
    throw new Error(
      "useEffectCtx must be used within an EffectCtxProvider",
    );
  }
  return context;
}

/**
 * @since 0.1.0
 * @category react-query
 */
export const useQueryClient = () => {
  const context = useEffectCtx();
  return Context.get(context, QueryClient);
};

/**
 * @since 0.1.0
 * @category react-query
 */
export const EffectServicesProvider = ({
                                         children,
                                       }: {
  children: React.ReactNode;
}) => {
  const [queryClient] = useState(() => new RQQueryClient());
  const context = useMemo(
    () => Context.empty().pipe(Context.add(QueryClient, queryClient)),
    [queryClient],
  );
  const runtime = useMemo(
    () =>
      Runtime.make({
        context,
        fiberRefs: FiberRefs.empty(),
        runtimeFlags: Runtime.defaultRuntimeFlags,
      }),
    [context],
  );

  return (
    <EffectRuntimeCtx.Provider value={runtime}>
      <EffectCtxContent.Provider value={context}>
        {children}
      </EffectCtxContent.Provider>
    </EffectRuntimeCtx.Provider>
  );
};