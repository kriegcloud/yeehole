import { Config, ConfigProvider} from "effect";
import Effect from "effect/Effect";
import Layer from "effect/Layer";

export const BuildEnvJson = ConfigProvider.fromJson({
  NODE_ENV: process.env["NODE_ENV"] || "development",
})

export const BuildEnv = Effect.provide(
  Config.all({
    NODE_ENV: Config.string("NODE_ENV"),
  }),
  Layer.setConfigProvider(BuildEnvJson),
)




