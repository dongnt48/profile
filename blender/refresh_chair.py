"""Rebuild the chair frame and membranes without replacing other room assets.

Run: D:/Blender/blender.exe --background blender/room.blend --python blender/refresh_chair.py
"""
import ast
import math
import os
import shutil
import tempfile
import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
expected = os.path.join(ROOT, 'blender', 'room.blend')
assert os.path.normcase(bpy.data.filepath) == os.path.normcase(expected)
source = open(os.path.join(ROOT, 'blender', 'build_room.py'), encoding='utf-8').read()
for path in [expected, os.path.join(ROOT, 'public', 'models', 'room.glb')]:
    shutil.copy2(path, os.path.join(tempfile.gettempdir(), 'profile-before-chair-repair-' + os.path.basename(path)))

frame = bpy.data.materials['Chair frame white']
for obj in list(bpy.data.objects):
    if obj.name in ['Chair seat mesh membrane', 'Chair back mesh membrane', 'Headrest mesh membrane'] or (
        obj.type == 'MESH' and any(slot.material == frame for slot in obj.material_slots)
    ):
        bpy.data.objects.remove(obj, do_unlink=True)

helpers = {'finish', 'box', 'cylinder', 'rod', 'curve', 'suspension_mesh'}
for node in ast.parse(source).body:
    if isinstance(node, ast.FunctionDef) and node.name in helpers:
        exec(compile(ast.Module(body=[node], type_ignores=[]), 'build_room.py', 'exec'), globals())

# Other chair materials are already batched into the existing room. Rebuild only
# the dedicated white frame and its three fitted membranes.
def frame_only(function, material_arg):
    def filtered(*args, **kwargs):
        material = kwargs.get('mat', args[material_arg] if len(args) > material_arg else None)
        return function(*args, **kwargs) if material == frame else None
    return filtered

box = frame_only(box, 3)
curve = frame_only(curve, 3)
rod = frame_only(rod, 4)
original_cylinder = cylinder
# rod uses cylinder internally and only the frame rails are requested here.
cylinder = frame_only(original_cylinder, 4)
chair_frame_white = frame
silver = bpy.data.materials['Brushed aluminum']
black = bpy.data.materials['Matte black'] if 'Matte black' in bpy.data.materials else None
dark_grey = armrest_grey = None
pellicle_navy = bpy.data.materials['Pellicle mesh navy']
pellicle_smoke = bpy.data.materials['Pellicle mesh smoke']
before = set(bpy.data.objects)
start = source.index('cx, cy = .05, -.77')
end = source.index("box('Rug underpad'", start)
exec(source[start:end], globals())

bpy.ops.object.select_all(action='DESELECT')
for obj in [obj for obj in bpy.data.objects if obj not in before]:
    if obj.type in {'MESH', 'CURVE'}:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.convert(target='MESH')
        obj.select_set(False)

bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT, 'public', 'models', 'room.glb'),
                          export_format='GLB', export_yup=True, export_cameras=False, export_lights=False)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=expected)
print('CHAIR_SEAMS_REPAIRED', flush=True)
