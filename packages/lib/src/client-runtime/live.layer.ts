import { NetworkMonitor } from "#client-runtime/network-monitor.js";
import { Layer, Logger, ManagedRuntime } from "effect";

export const LiveLayer = Layer.mergeAll(NetworkMonitor.Default).pipe(
  Layer.provide(Logger.pretty)
);

export type LiveManagedRuntime = ManagedRuntime.ManagedRuntime<
  Layer.Layer.Success<typeof LiveLayer>,
  never
>