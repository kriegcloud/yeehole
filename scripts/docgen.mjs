#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

/**
 * Runs `bun run docgen` in the specified directory.
 * @param {string} pkgDir - The directory where to run the command.
 * @returns {Promise<void>}
 */
function runDocgenInDir(pkgDir) {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", "docgen"], {
      cwd: pkgDir,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed in ${pkgDir} with exit code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

async function main() {
  const packagesDir = "packages";

  let entries;
  try {
    entries = await readdir(packagesDir, { withFileTypes: true });
  } catch (err) {
    console.error(`Error reading directory "${packagesDir}": ${err}`);
    process.exit(1);
  }

  // Filter to only directories inside the packages folder.
  const packageDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesDir, entry.name));

  // Prepare an array of promises for running the command in each package.
  const tasks = [];
  for (const dir of packageDirs) {
    try {
      // Check if the directory contains a package.json file.
      await stat(join(dir, "package.json"));
      console.log(`Running docgen in ${dir}...`);
      tasks.push(runDocgenInDir(dir));
    } catch {
      // If package.json does not exist, skip this directory.
      console.log(`Skipping ${dir} (no package.json found).`);
    }
  }

  try {
    // Run all tasks concurrently.
    await Promise.all(tasks);
    console.log("All docgen commands completed successfully.");
  } catch (err) {
    console.error(`Error: ${err}`);
    process.exit(1);
  }
}

main();
