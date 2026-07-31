"""
Headless GLB export for the Ailernova teacher avatar.

    blender --background avatar.blend --python blender/export_glb.py -- \
        --out public/models/teacher.glb

Every flag below is here for a reason. The defaults will silently ship you
a 30 MB avatar: shape key normals and tangents alone triple morph target
size, and without sparse accessors you pay for every vertex on every one
of the 52 shapes whether it moves or not.
"""

import argparse
import os
import sys

import bpy

# Blender hands script args after a bare "--"
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

parser = argparse.ArgumentParser()
parser.add_argument("--out", required=True)
parser.add_argument("--draco", action="store_true", default=True)
parser.add_argument("--no-draco", dest="draco", action="store_false")
args = parser.parse_args(argv)

os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)

# Selection-independent: export everything visible in the scene.
bpy.ops.object.select_all(action="DESELECT")

bpy.ops.export_scene.gltf(
    filepath=args.out,
    export_format="GLB",

    # --- morph targets: where the megabytes live -----------------------
    export_morph=True,
    export_morph_normal=False,      # recompute at runtime, nobody will see it
    export_morph_tangent=False,     # never needed for a stylised character
    # ------------------------------------------------------------------

    export_skins=True,
    export_animations=True,
    export_optimize_animation_size=True,
    export_anim_single_armature=True,

    export_apply=True,              # bake modifiers
    export_yup=True,
    export_texcoords=True,
    export_normals=True,
    export_tangents=False,
    export_materials="EXPORT",
    export_image_format="AUTO",

    export_draco_mesh_compression_enable=args.draco,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=12,
    export_draco_normal_quantization=8,
    export_draco_texcoord_quantization=10,

    export_cameras=False,
    export_lights=False,
    export_extras=False,
)

size_mb = os.path.getsize(args.out) / (1024 * 1024)
print(f"\n[export] wrote {args.out}  ({size_mb:.2f} MB)")

BUDGET_MB = 4.0
if size_mb > BUDGET_MB:
    print(f"[export] OVER BUDGET: {size_mb:.2f} MB > {BUDGET_MB} MB")
    print("[export] check: is the head a separate mesh from the body?")
    sys.exit(1)
