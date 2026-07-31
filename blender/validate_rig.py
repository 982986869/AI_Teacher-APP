"""
Validates a rigged .blend against the Ailernova avatar brief.

    blender --background avatar.blend --python blender/validate_rig.py

Run this the moment the artist delivers, before you pay the invoice.
Every check maps to something that is painful or impossible to fix later.
"""

import sys
import bpy

ARKIT_52 = [
    "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft",
    "browOuterUpRight", "cheekPuff", "cheekSquintLeft", "cheekSquintRight",
    "eyeBlinkLeft", "eyeBlinkRight", "eyeLookDownLeft", "eyeLookDownRight",
    "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft", "eyeLookOutRight",
    "eyeLookUpLeft", "eyeLookUpRight", "eyeSquintLeft", "eyeSquintRight",
    "eyeWideLeft", "eyeWideRight", "jawForward", "jawLeft", "jawOpen",
    "jawRight", "mouthClose", "mouthDimpleLeft", "mouthDimpleRight",
    "mouthFrownLeft", "mouthFrownRight", "mouthFunnel", "mouthLeft",
    "mouthLowerDownLeft", "mouthLowerDownRight", "mouthPressLeft",
    "mouthPressRight", "mouthPucker", "mouthRight", "mouthRollLower",
    "mouthRollUpper", "mouthShrugLower", "mouthShrugUpper", "mouthSmileLeft",
    "mouthSmileRight", "mouthStretchLeft", "mouthStretchRight",
    "mouthUpperUpLeft", "mouthUpperUpRight", "noseSneerLeft",
    "noseSneerRight", "tongueOut",
]

TRI_BUDGET = 50_000
BONE_BUDGET = 80

failures = []
warnings = []


def shape_keys(obj):
    if not obj.data.shape_keys:
        return []
    return [kb.name for kb in obj.data.shape_keys.key_blocks if kb.name != "Basis"]


meshes = [o for o in bpy.data.objects if o.type == "MESH"]
armatures = [o for o in bpy.data.objects if o.type == "ARMATURE"]

# --- 1. ARKit coverage ---------------------------------------------------
all_keys = set()
for m in meshes:
    all_keys.update(shape_keys(m))

missing = [n for n in ARKIT_52 if n not in all_keys]
if missing:
    failures.append(f"missing {len(missing)}/52 ARKit shape keys: {', '.join(missing[:8])}...")

# Catch the classic: right names, wrong case.
lowered = {k.lower(): k for k in all_keys}
miscased = [n for n in ARKIT_52 if n not in all_keys and n.lower() in lowered]
if miscased:
    failures.append(f"case mismatch on: {', '.join(f'{lowered[n.lower()]} -> {n}' for n in miscased[:5])}")

# --- 2. Head must be its own mesh ---------------------------------------
morph_meshes = [m for m in meshes if shape_keys(m)]
for m in morph_meshes:
    tris = sum(len(p.vertices) - 2 for p in m.data.polygons)
    if len(m.data.vertices) > 12_000:
        failures.append(
            f"'{m.name}' carries shape keys across {len(m.data.vertices)} verts. "
            "Split the head into its own mesh or every blendshape pays for the body."
        )
    if tris > TRI_BUDGET:
        warnings.append(f"'{m.name}' is {tris} tris")

# --- 3. Totals -----------------------------------------------------------
total_tris = sum(sum(len(p.vertices) - 2 for p in m.data.polygons) for m in meshes)
if total_tris > TRI_BUDGET:
    failures.append(f"{total_tris} triangles exceeds the {TRI_BUDGET} budget")

for arm in armatures:
    n = len(arm.data.bones)
    if n > BONE_BUDGET:
        failures.append(f"armature '{arm.name}' has {n} bones (budget {BONE_BUDGET})")

# --- 4. Rest pose sanity -------------------------------------------------
for m in morph_meshes:
    for kb in m.data.shape_keys.key_blocks:
        if kb.name != "Basis" and kb.value != 0.0:
            warnings.append(f"'{m.name}.{kb.name}' is not at rest (value={kb.value})")

# --- Report --------------------------------------------------------------
print("\n" + "=" * 58)
print(f"  meshes: {len(meshes)}   morph meshes: {len(morph_meshes)}")
print(f"  triangles: {total_tris:,} / {TRI_BUDGET:,}")
print(f"  ARKit coverage: {52 - len(missing)}/52")
print("=" * 58)

for w in warnings:
    print(f"  warn  {w}")
for f in failures:
    print(f"  FAIL  {f}")

if failures:
    print(f"\n{len(failures)} blocking issue(s). Send it back.\n")
    sys.exit(1)

print("\nRig passes. Safe to export.\n")
