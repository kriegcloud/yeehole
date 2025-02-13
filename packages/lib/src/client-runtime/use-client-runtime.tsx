import React from "react";
import { LiveManagedRuntime } from "#client-runtime/live.layer.js";
import { RuntimeContext} from "#client-runtime/client-runtime.context.js";

export const useRuntime = (): LiveManagedRuntime => {
  const runtime = React.useContext(RuntimeContext);
  if (runtime === null) throw new Error("useRuntime must be used within an AppRuntimeProvider");
  return runtime;
};