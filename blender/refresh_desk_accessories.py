"""Rebuild only the desk accessories in an existing generated room.

Run: D:/Blender/blender.exe --background blender/room.blend --python blender/refresh_desk_accessories.py
"""
import os
import sys
import bpy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
expected = os.path.join(ROOT, 'blender', 'room.blend')
assert os.path.normcase(bpy.data.filepath) == os.path.normcase(expected), 'Open the workspace room.blend first'
sys.path.insert(0, os.path.dirname(__file__))
from desk_accessories import build_speakers, build_headphones, build_desk_lamp

for name in ['SpeakerRoot_L', 'SpeakerRoot_R', 'HeadphonesRoot', 'DeskLampRoot']:
    root = bpy.data.objects.get(name)
    assert root, 'Missing accessory assembly: ' + name
    for obj in list(root.children_recursive) + [root]:
        bpy.data.objects.remove(obj, do_unlink=True)

before = set(bpy.data.objects)
silver = bpy.data.materials['Brushed aluminum']
build_speakers(bpy.data.materials['Walnut grain'], silver)
build_headphones(silver)
build_desk_lamp(silver)
created = [obj for obj in bpy.data.objects if obj not in before]
bpy.ops.object.select_all(action='DESELECT')
for obj in created:
    if obj.type in {'MESH', 'CURVE'}:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.convert(target='MESH')
        obj.select_set(False)
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT, 'public', 'models', 'room.glb'),
                          export_format='GLB', export_yup=True, export_cameras=False, export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=expected)
bpy.ops.render.render(write_still=True)
print('DESK_ACCESSORIES_REFRESHED', flush=True)
