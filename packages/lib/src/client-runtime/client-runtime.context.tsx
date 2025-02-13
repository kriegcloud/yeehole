import ManagedRuntime from "effect/ManagedRuntime";
import React from "react";
import {LiveManagedRuntime} from "#client-runtime/live.layer.js";

export type RuntimeContext = ManagedRuntime.ManagedRuntime.Context<LiveManagedRuntime>;
export const RuntimeContext = React.createContext<RuntimeContext | null>(null);