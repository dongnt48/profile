"""Refresh the PC without rebuilding the rest of the room.

Run: D:/Blender/blender.exe --background blender/room.blend --python blender/refresh_pc.py
"""
import os
import sys
import bpy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
expected = os.path.join(ROOT, 'blender', 'room.blend')
assert os.path.normcase(bpy.data.filepath) == os.path.normcase(expected), 'Open the workspace room.blend first'
sys.path.insert(0, os.path.dirname(__file__))
from pc_tower import build_pc_tower

root = bpy.data.objects.get('PCTowerRoot')
assert root, 'Missing PC assembly'
for obj in list(root.children_recursive) + [root]:
    bpy.data.objects.remove(obj, do_unlink=True)
before = set(bpy.data.objects)
build_pc_tower(bpy.data.materials['PC case white'], bpy.data.materials['Walnut grain'], bpy.data.materials['Brushed aluminum'])
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
print('PC_REFRESHED', flush=True)
