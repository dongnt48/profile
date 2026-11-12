"""Locally assembled audio equipment and lamps for the workspace."""
import math
import bpy
from mathutils import Vector


def finish_material(name, color, rough=.6, metal=0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = rough
    shader.inputs['Metallic'].default_value = metal
    return mat


class Assembly:
    def __init__(self, name, location, rotation=(0, 0, 0), parent=None):
        self.root = bpy.data.objects.new(name, None)
        bpy.context.collection.objects.link(self.root)
        self.root.parent = parent
        self.root.location = location
        self.root.rotation_euler = rotation

    def attach(self, obj, name, mat):
        obj.name = name
        obj.parent = self.root
        obj.data.materials.append(mat)
        return obj

    def box(self, name, pos, size, mat, bevel=.003, rotation=(0, 0, 0)):
        bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
        obj = bpy.context.object
        obj.dimensions = size
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        obj.rotation_euler = rotation
        self.attach(obj, name, mat)
        if bevel:
            mod = obj.modifiers.new('Machined edge radius', 'BEVEL')
            mod.width, mod.segments = bevel, 3
            obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
        return obj

    def cylinder(self, name, pos, radius, depth, mat, rotation=(0, 0, 0), bevel=.001):
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=radius, depth=depth, location=pos, rotation=rotation)
        obj = self.attach(bpy.context.object, name, mat)
        for poly in obj.data.polygons:
            poly.use_smooth = len(poly.vertices) == 4
        if bevel:
            mod = obj.modifiers.new('Rounded cylinder edges', 'BEVEL')
            mod.width, mod.segments = bevel, 3
            obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
        return obj

    def sphere(self, name, pos, radii, mat):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, location=pos)
        obj = self.attach(bpy.context.object, name, mat)
        obj.scale = radii
        for poly in obj.data.polygons:
            poly.use_smooth = True
        return obj

    def mesh(self, name, vertices, faces, mat, pos=(0, 0, 0)):
        data = bpy.data.meshes.new(name)
        data.from_pydata(vertices, [], faces)
        data.update()
        for poly in data.polygons:
            poly.use_smooth = len(poly.vertices) <= 4
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = pos
        return self.attach(obj, name, mat)

    def curve(self, name, points, radius, mat):
        data = bpy.data.curves.new(name, 'CURVE')
        data.dimensions = '3D'
        data.bevel_depth, data.bevel_resolution = radius, 3
        spline = data.splines.new('POLY')
        spline.points.add(len(points) - 1)
        for point, co in zip(spline.points, points):
            point.co = (*co, 1)
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        return self.attach(obj, name, mat)

    def rod(self, name, a, b, radius, mat):
        a, b = Vector(a), Vector(b)
        obj = self.cylinder(name, (a + b) / 2, radius, (b - a).length, mat)
        obj.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()
        return obj

    def ring(self, name, pos, ry, rz, thickness, depth, mat, axis='x'):
        vertices, faces = [], []
        for i in range(64):
            angle = i * math.tau / 64
            for j in range(12):
                phi = j * math.tau / 12
                a = depth * math.cos(phi)
                b = (ry + thickness * math.sin(phi)) * math.cos(angle)
                c = (rz + thickness * math.sin(phi)) * math.sin(angle)
                vertices.append((a, b, c) if axis == 'x' else (b, a, c))
        for i in range(64):
            for j in range(12):
                face = (i * 12 + j, ((i + 1) % 64) * 12 + j,
                        ((i + 1) % 64) * 12 + (j + 1) % 12, i * 12 + (j + 1) % 12)
                faces.append(tuple(reversed(face)) if axis == 'x' else face)
        return self.mesh(name, vertices, faces, mat, pos)

    def lathe(self, name, pos, profile, mat, axis='z', flip=False):
        vertices, faces = [], []
        for radius, height in profile:
            for i in range(64):
                angle = i * math.tau / 64
                a, b = radius * math.cos(angle), radius * math.sin(angle)
                vertices.append((a, b, height) if axis == 'z' else (a, height, b))
        for ring in range(len(profile) - 1):
            for i in range(64):
                j = (i + 1) % 64
                face = (ring * 64 + i, ring * 64 + j, (ring + 1) * 64 + j, (ring + 1) * 64 + i)
                faces.append(tuple(reversed(face)) if axis == 'y' or flip else face)
        return self.mesh(name, vertices, faces, mat, pos)


def build_speakers(wood, silver):
    graphite = finish_material('Speaker graphite baffle', (.025, .032, .042), .72)
    rubber = finish_material('Speaker rubber surround', (.012, .017, .023), .9)
    cone = finish_material('Speaker woven cone', (.055, .065, .080), .86)
    trim = finish_material('Speaker driver trim', (.12, .14, .17), .38, .55)
    roots = []
    for side, x, angle in [('L', -.79, .22), ('R', .97, -.22)]:
        a = Assembly('SpeakerRoot_' + side, (x, 1.28, 1.218), (0, 0, angle))
        a.box('Speaker isolation pad', (0, 0, .009), (.172, .184, .018), rubber, .005)
        a.box('Speaker wood enclosure', (0, 0, .176), (.19, .218, .29), wood, .008)
        a.box('Speaker front baffle', (0, -.111, .176), (.173, .012, .270), graphite, .004)
        a.ring('Speaker woofer mounting ring', (0, -.121, .126), .059, .059, .003, .004, trim, 'y')
        a.ring('Speaker woofer suspension', (0, -.129, .126), .051, .051, .005, .004, rubber, 'y')
        a.lathe('Speaker recessed woofer cone', (0, -.124, .126), [(.014, .002), (.047, -.004)], cone, 'y')
        a.sphere('Speaker dust cap', (0, -.125, .126), (.017, .006, .017), graphite)
        a.lathe('Speaker tweeter waveguide', (0, -.122, .253), [(.014, .002), (.031, -.004), (.033, -.003)], graphite, 'y')
        a.ring('Speaker tweeter trim', (0, -.122, .253), .031, .031, .0015, .002, trim, 'y')
        a.sphere('Speaker tweeter dome', (0, -.125, .253), (.014, .005, .014), rubber)
        a.box('Speaker bass reflex slot', (0, -.118, .044), (.065, .004, .008), rubber, .002)
        for sx in [-.073, .073]:
            for z in [.052, .298]:
                a.cylinder('Speaker recessed screw', (sx, -.118, z), .0025, .0015, trim, (math.pi / 2, 0, 0), .0003)
        roots.append(a.root)
    return roots


def build_headphones(silver):
    shell = finish_material('Headphone anodized shell', (.06, .075, .10), .42, .25)
    padding = finish_material('Headphone leather cushion', (.018, .025, .035), .91)
    fabric = finish_material('Headphone acoustic fabric', (.008, .012, .018), .98)
    a = Assembly('HeadphonesRoot', (-.88, .92, 1.218))
    a.box('Headphone weighted stand base', (0, .018, .009), (.125, .105, .018), shell, .012)
    a.rod('Headphone stand stem', (0, .027, .02), (0, .027, .333), .0055, silver)
    a.box('Headphone padded saddle', (0, .007, .334), (.07, .055, .012), padding, .005)

    def band(name, rx, rz, width, thick, start, end, mat):
        vertices, faces = [], []
        for i in range(65):
            theta = start + (end - start) * i / 64
            normal = Vector((math.cos(theta) / rx, 0, math.sin(theta) / rz)).normalized()
            center = Vector((rx * math.cos(theta), 0, .195 + rz * math.sin(theta)))
            for y, offset in [(-width / 2, -thick / 2), (width / 2, -thick / 2),
                              (width / 2, thick / 2), (-width / 2, thick / 2)]:
                point = center + normal * offset
                vertices.append((point.x, y, point.z))
        for i in range(64):
            for j in range(4):
                faces.append(((i + 1) * 4 + j, (i + 1) * 4 + (j + 1) % 4, i * 4 + (j + 1) % 4, i * 4 + j))
        faces.extend([(3, 2, 1, 0), (256, 257, 258, 259)])
        a.mesh(name, vertices, faces, mat)

    band('Headphone curved headband', .125, .158, .035, .005, 0, math.pi, shell)
    band('Headphone inner headband padding', .118, .151, .030, .006, .15, math.pi - .15, padding)
    for side, sign in [('L', -1), ('R', 1)]:
        a.sphere('Headphone ear housing ' + side, (sign * .124, 0, .160), (.020, .052, .068), shell)
        a.sphere('Headphone outer cap ' + side, (sign * .141, 0, .160), (.004, .044, .058), shell)
        a.ring('Headphone open ear cushion ' + side, (sign * .101, 0, .160), .035, .048, .010, .009, padding)
        a.sphere('Headphone recessed inner fabric ' + side, (sign * .111, 0, .160), (.002, .032, .045), fabric)
        for front in [-1, 1]:
            points = []
            for i in range(17):
                t = i / 16
                points.append((sign * (.125 + .012 * t), front * .047 * math.sin(t * math.pi / 2), .225 - .065 * t))
            a.curve('Headphone yoke fork ' + side, points, .0035, silver)
        a.cylinder('Headphone cup pivot ' + side, (sign * .144, 0, .185), .006, .004, silver, (0, math.pi / 2, 0))
    return a.root


def build_desk_lamp(silver):
    shell = finish_material('Desk lamp graphite', (.055, .067, .085), .55, .18)
    rubber = finish_material('Desk lamp rubber', (.015, .02, .026), .9)
    diffuser = finish_material('Desk lamp passive diffuser', (.90, .94, .98), .78)
    interior = finish_material('Desk lamp inner reflector', (.68, .72, .77), .5, .25)
    a = Assembly('DeskLampRoot', (-.82, 1.56, 1.218))
    a.cylinder('Desk lamp rubber foot', (0, 0, .003), .092, .006, rubber)
    a.cylinder('Desk lamp weighted base', (0, 0, .014), .095, .022, shell, bevel=.004)
    a.cylinder('Desk lamp rotating collar', (0, 0, .035), .021, .020, silver, bevel=.002)
    a.box('Desk lamp rocker switch', (.045, -.025, .026), (.012, .021, .003), rubber, .001)
    base, elbow, head = Vector((0, 0, .055)), Vector((-.04, .02, .43)), Vector((.16, -.15, .72))
    for sign in [-1, 1]:
        offset = Vector((0, sign * .012, 0))
        a.rod('Desk lamp lower linkage', base + offset, elbow + offset, .0055, shell)
        a.rod('Desk lamp upper linkage', elbow + offset, head + offset, .005, shell)
    for name, point, radius in [('base', base, .019), ('elbow', elbow, .021), ('head', head, .017)]:
        a.cylinder('Desk lamp ' + name + ' hinge', point, radius, .034, shell, (math.pi / 2, 0, 0))
        a.cylinder('Desk lamp ' + name + ' hinge screw', point + Vector((0, -.019, 0)), radius * .32, .004, silver, (math.pi / 2, 0, 0))
    spring = []
    for i in range(121):
        t = i / 120
        point = base.lerp(elbow, .20 + .53 * t)
        spring.append((point.x + .007 * math.cos(t * math.tau * 11), point.y + .03 + .007 * math.sin(t * math.tau * 11), point.z))
    a.curve('Desk lamp tension spring', spring, .0012, silver)
    shade = Assembly('DeskLampShadeRoot', (.16, -.15, .73), (.22, -.18, 0), a.root)
    shade.lathe('Desk lamp hollow metal shade', (0, 0, 0),
                [(.027, .005), (.033, .002), (.12, -.125), (.12, -.13),
                 (.115, -.13), (.111, -.123), (.028, -.004), (.027, .005)], shell, flip=True)
    shade.lathe('Desk lamp recessed reflector', (0, 0, 0), [(.029, -.006), (.109, -.121)], interior)
    shade.sphere('Desk lamp opal bulb', (0, 0, -.070), (.025, .025, .039), diffuser)
    shade.cylinder('Desk lamp bulb socket', (0, 0, -.025), .014, .028, shell)
    shade.cylinder('Desk lamp socket collar', (0, 0, -.040), .015, .007, silver, bevel=.0005)
    shade.cylinder('Desk lamp rear socket', (0, 0, .015), .020, .024, shell, bevel=.002)
    a.curve('Desk lamp power cable', [(0, .07, .009), (.015, .13, .005), (.04, .22, .004), (.02, .30, -.018)], .0025, rubber)
    return a.root


