"""A smooth wireless mouse, authored in local coordinates for the room builder."""
import math
import bpy


def build_mouse(position, body_mat, wheel_mat, base_mat):
    root = bpy.data.objects.new('MouseRoot', None)
    bpy.context.collection.objects.link(root)
    root.location = position
    root.rotation_euler.z = -.10

    def mesh_object(name, vertices, faces, mat, smooth=True):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        for poly in mesh.polygons:
            poly.use_smooth = smooth and len(poly.vertices) <= 4
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        obj.data.materials.append(mat)
        obj.parent = root
        return obj

    def matte(name, color):
        mat = bpy.data.materials.new(name)
        mat.diffuse_color = (*color, 1)
        mat.use_nodes = True
        shader = mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = (*color, 1)
        shader.inputs['Roughness'].default_value = .68
        return mat

    click_mat = matte('Mouse click paddles', (.10, .12, .16))
    rubber = matte('Mouse rubber', (.025, .032, .045))

    def half_width(v):
        return .039 * math.sqrt(max(0, 1 - v * v)) * (1 - .10 * v)

    def surface(v, u, lift=0):
        # Rear-biased palm dome, low nose and smoothly rounded sidewalls.
        height = .036 * max(0, 1 - v * v) ** .65 * (1 - .20 * v)
        return (half_width(v) * u, .066 * v,
                .008 + height * math.sqrt(max(0, 1 - u * u)) + lift)

    # An elliptical, low-profile base replaces the rectangular chassis.
    count = 64
    vertices = []
    for radius, z in [(.93, .001), (1, .0035), (.98, .008)]:
        for i in range(count):
            angle = i * math.tau / count
            v = math.sin(angle)
            vertices.append((.040 * math.cos(angle) * (1 - .1 * v) * radius,
                             .067 * v * radius, z))
    faces = [tuple(reversed(range(count)))]
    for ring in range(2):
        for i in range(count):
            j = (i + 1) % count
            faces.append((ring * count + i, ring * count + j,
                          (ring + 1) * count + j, (ring + 1) * count + i))
    faces.append(tuple(range(2 * count, 3 * count)))
    mesh_object('Mouse curved base', vertices, faces, rubber)

    # Sample a continuous dome. Single vertices at the tips avoid pinched,
    # duplicated pole faces and keep the silhouette smooth from every angle.
    rows, columns = 48, 40
    vertices = [surface(-1, 0)]
    for row in range(1, rows):
        v = -math.cos(math.pi * row / rows)
        for col in range(columns + 1):
            u = -math.cos(math.pi * col / columns)
            vertices.append(surface(v, u))
    front = len(vertices)
    vertices.append(surface(1, 0))
    faces = [(0, 1 + col + 1, 1 + col) for col in range(columns)]
    for row in range(rows - 2):
        a, b = 1 + row * (columns + 1), 1 + (row + 1) * (columns + 1)
        faces.extend((a + col, a + col + 1, b + col + 1, b + col) for col in range(columns))
    last = 1 + (rows - 2) * (columns + 1)
    faces.extend((last + col, last + col + 1, front) for col in range(columns))
    mesh_object('Mouse palm shell', vertices, faces, body_mat)

    # Both buttons follow the same dome, with a real center gap and a small
    # clearance above the shell. They never intersect or share visible faces.
    for sign, name in [(-1, 'Mouse left button'), (1, 'Mouse right button')]:
        vertices, faces = [], []
        for row in range(21):
            v = .12 + .79 * row / 20
            inner = .0055 / half_width(v)
            for col in range(17):
                u = sign * (inner + (.93 - inner) * col / 16)
                vertices.append(surface(v, u, .0012))
        for row in range(20):
            for col in range(16):
                a = row * 17 + col
                face = (a, a + 1, a + 18, a + 17)
                faces.append(tuple(reversed(face)) if sign < 0 else face)
        button = mesh_object(name, vertices, faces, click_mat)
        solid = button.modifiers.new('Thin click paddle', 'SOLIDIFY')
        solid.thickness = .0008
        solid.offset = -1

    # A dark recess and a raised transverse wheel make the mouse readable even
    # at the room camera's scale. The wheel's axle runs left-to-right.
    vertices, faces = [], []
    for row in range(17):
        y = .021 + .027 * row / 16
        v = y / .066
        for x in [-.006, .006]:
            vertices.append(surface(v, x / half_width(v), .0015))
        if row:
            a = (row - 1) * 2
            faces.append((a, a + 1, a + 3, a + 2))
    mesh_object('Mouse wheel recess', vertices, faces, rubber)
    wheel_z = surface(.035 / .066, 0)[2] - .0015
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=.0105, depth=.0075,
                                      location=(0, .035, wheel_z), rotation=(0, math.pi / 2, 0))
    wheel = bpy.context.object
    wheel.name = 'Mouse scroll wheel'
    wheel.data.materials.append(wheel_mat)
    wheel.parent = root
    for poly in wheel.data.polygons:
        poly.use_smooth = len(poly.vertices) == 4
    bevel = wheel.modifiers.new('Rounded wheel edges', 'BEVEL')
    bevel.width, bevel.segments = .0007, 3
    wheel.modifiers.new('Wheel normals', 'WEIGHTED_NORMAL')

    # Small rubber tread bars sit on the exposed rim of the metal wheel.
    for i in range(24):
        angle = math.tau * i / 24
        y = .035 + math.sin(angle) * .01055
        z = wheel_z + math.cos(angle) * .01055
        bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=4, radius=1,
                                           location=(0, y, z))
        tread = bpy.context.object
        tread.name = 'Mouse wheel tread'
        tread.scale = (.0035, .0003, .0003)
        tread.data.materials.append(rubber)
        tread.parent = root

    # A subtle front charging port reinforces the orientation without an
    # oversized thumb wing or protruding blocks on the shell.
    vertices = [(-.005, .0655, .007), (.005, .0655, .007),
                (.005, .0655, .011), (-.005, .0655, .011)]
    mesh_object('Mouse charging port', vertices, [(3, 2, 1, 0)], base_mat, False)
    return root
