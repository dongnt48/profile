"""Move the complete static chair back, preserving the existing room and camera path."""
import bpy
import os
import shutil
import tempfile
from mathutils import Vector

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
assert os.path.normcase(bpy.data.filepath) == os.path.normcase(os.path.join(root, 'blender/room.blend'))
stored = bpy.context.scene.get('chair_camera_clearance', 0)
previous = .6 if stored is True else float(stored)
target = .35
assert abs(previous - target) > .001, 'Chair placement already applied'
for relative in ['blender/room.blend', 'public/models/room.glb']:
    shutil.copy2(os.path.join(root, relative), os.path.join(tempfile.gettempdir(), 'profile-before-chair-placement-' + os.path.basename(relative)))

moved = 0
for obj in bpy.context.scene.objects:
    if obj.type != 'MESH':
        continue
    mesh = obj.data
    # Static meshes are batched by material. Find complete connected pieces,
    # so frame, wheels and membranes move together without touching the room.
    adjacency = [[] for _ in mesh.vertices]
    for edge in mesh.edges:
        a, b = edge.vertices
        adjacency[a].append(b)
        adjacency[b].append(a)
    seen = set()
    for vertex in mesh.vertices:
        if vertex.index in seen:
            continue
        component = []
        pending = [vertex.index]
        seen.add(vertex.index)
        while pending:
            index = pending.pop()
            component.append(index)
            for neighbor in adjacency[index]:
                if neighbor not in seen:
                    seen.add(neighbor)
                    pending.append(neighbor)
        points = [obj.matrix_world @ mesh.vertices[i].co for i in component]
        if not points or not all(-.6 <= p.x <= .7 and -.96 - previous <= p.y <= .16 - previous and .025 <= p.z <= 1.86 for p in points):
            continue
        # Exclude flat floor/rug geometry in the same footprint.
        if max(p.z for p in points) < .10:
            continue
        offset = obj.matrix_world.to_3x3().inverted() @ Vector((0, previous - target, 0))
        for index in component:
            mesh.vertices[index].co += offset
        moved += 1
    mesh.update()
assert moved > 10, f'Unexpected chair selection: {moved}'
bpy.context.scene['chair_camera_clearance'] = target
bpy.ops.export_scene.gltf(filepath=os.path.join(root, 'public/models/room.glb'), export_format='GLB', export_yup=True, export_cameras=False, export_lights=False)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root, 'blender/room.blend'))
print('CHAIR_COMPONENTS_MOVED', moved)
