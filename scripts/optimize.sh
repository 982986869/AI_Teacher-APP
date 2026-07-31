#!/usr/bin/env bash
# Post-export optimization. Run once in CI, never during iteration —
# the KTX2 encode is the only slow step in the whole pipeline (~1-5 min
# per 2K texture) and it does not need to happen on every Blender export.
#
#   ./scripts/optimize.sh public/models/teacher.glb
#
# Requires: npm i -g @gltf-transform/cli

set -euo pipefail

IN="${1:?usage: optimize.sh <input.glb>}"
OUT="${IN%.glb}.opt.glb"
BUDGET_BYTES=$((4 * 1024 * 1024))

size() { wc -c < "$1" | tr -d ' '; }

echo "in:  $(( $(size "$IN") / 1024 )) KB"

# Meshopt generally beats Draco on morph-heavy models — Draco's morph
# handling is weaker than its base-geometry handling. Both are produced
# here; measure on your actual asset rather than trusting either of us.
gltf-transform optimize "$IN" "$OUT" \
  --compress meshopt \
  --texture-compress ktx2 \
  --texture-size 2048 \
  --simplify false \
  --prune true \
  --prune-attributes true \
  --join false \
  --flatten false \
  --weld true

gltf-transform draco "$IN" "${IN%.glb}.draco.glb" --quantize-position 12 || true

echo "out: $(( $(size "$OUT") / 1024 )) KB  (meshopt)"
[ -f "${IN%.glb}.draco.glb" ] && echo "     $(( $(size "${IN%.glb}.draco.glb") / 1024 )) KB  (draco)"

gltf-transform inspect "$OUT" | sed -n '/meshes/,/animations/p'

if [ "$(size "$OUT")" -gt "$BUDGET_BYTES" ]; then
  echo
  echo "OVER BUDGET: $(( $(size "$OUT") / 1024 )) KB > $(( BUDGET_BYTES / 1024 )) KB"
  echo "First thing to check: is the head a separate mesh from the body?"
  exit 1
fi

echo
echo "Within budget."
