import * as Fs from "node:fs";
import Package from "../packages/domain/package.json" assert { type: "json" };

const tpl = Fs.readFileSync("./scripts/version.template.txt").toString("utf8");

Fs.writeFileSync(
  "packages/domain/src/internal/version.ts",
  tpl.replace("VERSION", Package.version),
);
