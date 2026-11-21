"""Continuous gravity-hung linen panels and hardware, in Blender Z-up space."""
import math
import bpy
from mathutils import Vector


def build_curtains(linen, rail_material, hardware_material):
    root = bpy.data.objects.new('CurtainsRoot', None)
    bpy.context.collection.objects.link(root)

    def attach(obj, name, material):
        obj.name = name
        obj.parent = root
        obj.data.materials.append(material)
        return obj

    def bar(name, start, end, radius, material):
        start, end = Vector(start), Vector(end)
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=radius, depth=(end - start).length, location=(start + end) / 2)
        obj = bpy.context.object
        obj.rotation_euler = (end - start).to_track_quat('Z', 'Y').to_euler()
        for face in obj.data.polygons:
            face.use_smooth = True
        return attach(obj, name, material)

    rail_x, rail_z = 2.60, 2.895
    bar('Curtain rail', (rail_x, -1.60, rail_z), (rail_x, 2.01, rail_z), .014, rail_material)
    for y in [-1.55, .24, 1.98]:
        bar('Curtain wall bracket', (2.67, y, rail_z), (rail_x, y, rail_z), .010, hardware_material)
    for y in [-1.615, 2.025]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=.020, location=(rail_x, y, rail_z))
        attach(bpy.context.object, 'Curtain finial', hardware_material)

    columns, rows, pleats = 72, 48, 6
    # The sill spans Y [-1.22, 1.70]. Keep both gathered panels outside it.
    for name, start_y, end_y in [('front', -1.56, -1.28), ('back', 1.73, 2.01)]:
        vertices, faces = [], []
        for row in range(rows + 1):
            v = row / rows
            for column in range(columns + 1):
                u = column / columns
                # The top edge meets each ring; fabric sags gently between rings.
                sag = .008 * math.sin(math.pi * pleats * u) ** 2 * (1 - v) ** 3
                depth = .024 * (1 + .10 * v) * math.sin(math.tau * pleats * u)
                x = rail_x + depth - .006 * math.sin(math.pi * v)
                y = start_y + (end_y - start_y) * u
                z = 2.863 * (1 - v) + .080 * v - sag
                vertices.append((x, y, z))
        for row in range(rows):
            for column in range(columns):
                index = row * (columns + 1) + column
                faces.append((index, index + 1, index + columns + 2, index + columns + 1))
        mesh = bpy.data.meshes.new(f'Curtain {name} continuous cloth')
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        uv = mesh.uv_layers.new(name='Linen UV')
        for face in mesh.polygons:
            face.use_smooth = True
            for loop in face.loop_indices:
                index = mesh.loops[loop].vertex_index
                uv.data[loop].uv = ((index % (columns + 1)) / columns, (index // (columns + 1)) / rows)
        panel = bpy.data.objects.new(f'Curtain panel {name}', mesh)
        bpy.context.collection.objects.link(panel)
        attach(panel, panel.name, linen)
        solidify = panel.modifiers.new('Linen thickness', 'SOLIDIFY')
        solidify.thickness = .002
        solidify.offset = 0

        for i in range(pleats + 1):
            y = start_y + (end_y - start_y) * i / pleats
            bpy.ops.mesh.primitive_torus_add(major_segments=24, minor_segments=8, major_radius=.032, minor_radius=.003,
                                            location=(rail_x, y, rail_z), rotation=(math.pi / 2, 0, 0))
            ring = attach(bpy.context.object, f'Curtain ring {name} {i}', hardware_material)
            for face in ring.data.polygons:
                face.use_smooth = True
    return root
