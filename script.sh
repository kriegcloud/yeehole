#!/bin/bash
for pkg in packages/*/; do
  if [ -f "$pkg/package.json" ]; then
    (
      cd "$pkg" && bun run docgen
    ) &
  fi
done
wait