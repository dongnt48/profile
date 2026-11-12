"""Open steel PC chassis with a wood intake, tempered glass and visible hardware."""
import math
import os
import random
import bpy
from mathutils import Vector
from desk_accessories import Assembly, finish_material
from monitor_hardware import rounded_loop


def natural_oak():
    mat = finish_material('PC natural oak', (1, 1, 1), .52)
    width, height = 512, 1024
    image = bpy.data.images.get('PC natural oak texture') or bpy.data.images.new('PC natural oak texture', width=width, height=height)
    pixels = [0.0] * (width * height * 4)
    rng = random.Random(97)
    for y in range(height):
        v = y / height
        for x in range(width):
            u = x / width
            phase = u * 120 + .8 * math.sin(v * 3.2) + .35 * math.sin(v * 15 + u * 3)
            grain = .06 * math.sin(phase) + .025 * math.sin(phase * 3.5 + v * .8)
            fiber = .015 * math.sin(u * 410 + v * 1.7)
            value = 1 + grain + fiber + (rng.random() - .5) * .028
            offset = (y * width + x) * 4
            pixels[offset:offset + 4] = [.43 * value, .28 * value, .15 * value, 1]
    image.pixels = pixels
    image.filepath_raw = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'textures', 'pc-natural-oak.png')
    image.file_format = 'PNG'
    image.save()
    image.pack()
    tex = next((node for node in mat.node_tree.nodes if node.type == 'TEX_IMAGE'), None) or mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = image
    mat.node_tree.links.new(tex.outputs['Color'], mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    return mat


def batch_boxes(a, name, boxes, mat):
    vertices, faces = [], []
    for center, size in boxes:
        offset = len(vertices)
        x, y, z = center
        w, d, h = (value / 2 for value in size)
        vertices.extend([(x - w, y - d, z - h), (x + w, y - d, z - h),
                         (x + w, y + d, z - h), (x - w, y + d, z - h),
                         (x - w, y - d, z + h), (x + w, y - d, z + h),
                         (x + w, y + d, z + h), (x - w, y + d, z + h)])
        faces.extend(tuple(offset + index for index in face) for face in
                     [(3, 2, 1, 0), (0, 1, 5, 4), (1, 2, 6, 5),
                      (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7)])
    obj = a.mesh(name, vertices, faces, mat)
    for poly in obj.data.polygons:
        poly.use_smooth = False
    return obj


def bezier(a, b, c, d, count=32):
    a, b, c, d = map(Vector, (a, b, c, d))
    return [tuple(a * (1 - t) ** 3 + b * 3 * t * (1 - t) ** 2
                  + c * 3 * t * t * (1 - t) + d * t ** 3)
            for t in (i / (count - 1) for i in range(count))]


def build_fan(parent, name, position, size, frame_mat, rotor_mat, metal, light=None, rotation=(0, 0, 0)):
    a = Assembly('PC fan assembly ' + name, position, rotation, parent)
    outer = rounded_loop(size, size, size * .055)
    count, depth, radius = len(outer), size * .10, size * .43
    inner = [(radius * x / math.hypot(x, z), radius * z / math.hypot(x, z)) for x, z in outer]
    vertices = [(x, y, z) for y in [-depth / 2, depth / 2] for loop in [outer, inner] for x, z in loop]
    faces = []
    for i in range(count):
        j = (i + 1) % count
        faces.extend([(i, j, count + j, count + i),
                      (2 * count + i, 3 * count + i, 3 * count + j, 2 * count + j),
                      (i, 2 * count + i, 2 * count + j, j),
                      (count + i, count + j, 3 * count + j, 3 * count + i)])
    casing = a.mesh('PC open fan frame ' + name, vertices, faces, frame_mat)
    for poly in casing.data.polygons:
        if poly.index % 4 < 2:
            poly.use_smooth = False
    edge = casing.modifiers.new('Fan frame edge radius', 'BEVEL')
    edge.width, edge.segments, edge.limit_method = min(.001, size * .005), 2, 'ANGLE'
    for sx in [-1, 1]:
        for sz in [-1, 1]:
            a.cylinder('PC fan mounting screw ' + name, (sx * size * .44, -depth / 2 - .001, sz * size * .44),
                       size * .012, .004, metal, (math.pi / 2, 0, 0), .0005)
    for i in range(4):
        angle = math.pi / 4 + i * math.pi / 2
        a.rod('PC fan fixed support ' + name, (0, depth * .42, 0),
              (radius * math.cos(angle), depth * .42, radius * math.sin(angle)), size * .009, frame_mat)
    if light:
        a.ring('PC intake light diffuser ' + name, (0, -depth / 2, 0),
               size * .414, size * .414, .0018, .0014, light, 'y')

    rotor = Assembly('FanRoot_PC_' + name, (0, 0, 0), parent=a.root)
    rotor.sphere('PC fan rotor hub ' + name, (0, -.003, 0), (size * .095, size * .043, size * .095), rotor_mat)
    vertices, faces = [], []
    for blade in range(7):
        start = len(vertices)
        for side in [-1, 1]:
            for step in range(9):
                t = step / 8
                radius = size * (.085 + .313 * t)
                sweep = blade * math.tau / 7 + .62 * t
                half_width = .15 + .06 * t
                for edge in [-1, 1]:
                    angle = sweep + edge * half_width
                    vertices.append((math.sin(angle) * radius,
                                     side * .0015 + size * .018 * math.sin(t * math.pi),
                                     math.cos(angle) * radius))
        for step in range(8):
            p = start + step * 2
            faces.extend([(p, p + 2, p + 3, p + 1), (p + 18, p + 19, p + 21, p + 20),
                          (p, p + 18, p + 20, p + 2), (p + 1, p + 3, p + 21, p + 19)])
        faces.extend([(start, start + 1, start + 19, start + 18),
                      (start + 16, start + 34, start + 35, start + 17)])
    rotor.mesh('PC swept fan blades ' + name, vertices, [tuple(reversed(face)) for face in faces], rotor_mat)
    return a.root


def build_pc_tower(white, wood, silver):
    white = finish_material('PC case white', (.78, .80, .82), .42, .12)
    wood = natural_oak()
    frame = finish_material('PC dark steel chassis', (.008, .012, .018), .52, .18)
    rubber = finish_material('PC rubber and cable sleeves', (.012, .018, .025), .94)
    rotor = finish_material('PC graphite fan rotor', (.012, .017, .025), .60)
    pcb = finish_material('PC motherboard PCB', (.008, .014, .012), .78)
    heatsink = finish_material('PC heatsink aluminum', (.28, .31, .35), .35, .85)
    anodized = finish_material('PC GPU anodized metal', (.010, .015, .023), .34, .7)
    light = finish_material('PC warm white diffuser', (.94, .90, .80), .44)
    shader = light.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Emission Color'].default_value = (.94, .90, .80, 1)
    shader.inputs['Emission Strength'].default_value = .25
    glass = finish_material('PC tempered glass', (.25, .31, .38), .085)
    glass.diffuse_color = (.25, .31, .38, .26)
    glass.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value = .26
    glass.surface_render_method = 'DITHERED'
    glass.use_backface_culling = False
    a = Assembly('PCTowerRoot', (1.19, 1.33, .035))

    # Separate structural panels leave the main chamber open behind the glass.
    for x in [-.176, .176]:
        for y in [-.26, .26]:
            a.cylinder('PC rubber isolation foot', (x, y, .025), .032, .048, rubber, bevel=.003)
    a.box('PC bottom steel plate', (0, 0, .052), (.46, .70, .010), white, .003)
    for x in [-.218, .218]:
        for y in [-.335, .335]:
            a.box('PC corner rail', (x, y, .458), (.022, .022, .806), white, .003)
    a.box('PC right steel side panel', (.225, 0, .458), (.008, .674, .792), white, .004)
    a.box('PC motherboard mounting tray', (.213, .035, .55), (.010, .52, .56), white, .003)
    a.box('PC PSU shroud top', (0, .065, .245), (.432, .55, .010), white, .003)
    a.box('PC PSU shroud left cover', (-.218, .065, .151), (.010, .55, .182), white, .003)
    a.box('PC PSU shroud front cap', (0, -.205, .151), (.432, .010, .182), white, .003)
    a.box('PC actual power supply', (0, .19, .145), (.29, .27, .13), frame, .004)
    a.box('PC cable grommet', (-.15, .13, .251), (.045, .06, .003), rubber, .004)

    # A single pane avoids transparent front/back faces competing for depth.
    a.mesh('PC single tempered side pane', [(-.227, -.313, .252), (-.227, -.313, .842),
                                           (-.227, .313, .842), (-.227, .313, .252)], [(0, 1, 2, 3)], glass)
    frit = finish_material('PC glass printed border', (.008, .012, .017), .34)
    batch_boxes(a, 'PC glass printed perimeter',
                [((-.228, 0, z), (.001, .626, .008)) for z in [.256, .838]]
                + [((-.228, y, .547), (.001, .008, .574)) for y in [-.309, .309]], frit)
    for y in [-.305, .305]:
        for z in [.275, .82]:
            a.cylinder('PC glass retention screw', (-.234, y, z), .005, .006, frame, (0, math.pi / 2, 0))

    # A genuine open front: wooden slats in front of the intake, not an opaque box.
    for x in [-.212, .212]:
        a.box('PC front frame side', (x, -.353, .464), (.026, .020, .812), white, .004)
    for z in [.082, .850]:
        a.box('PC front frame cross rail', (0, -.353, z), (.424, .020, .028), white, .004)
    for i in range(9):
        slat = a.box('PC wood intake slat', (-.176 + .044 * i, -.368, .472), (.022, .018, .718), wood, .0025)
        for poly in slat.data.polygons:
            for index in poly.loop_indices:
                co = slat.data.vertices[slat.data.loops[index].vertex_index].co
                slat.data.uv_layers.active.data[index].uv = ((co.x / .022 + .5) * .12 + i * .10, co.z / .718 + .5)
    for name, z in [('intake_lower', .33), ('intake_upper', .665)]:
        build_fan(a.root, name, (0, -.307, z), .326, frame, rotor, silver, light)

    # Open vented roof above the radiator, with a separate top I/O strip.
    for x in [-.202, .202]:
        a.box('PC roof edge rail', (x, 0, .867), (.056, .70, .016), white, .003)
    for y in [-.314, .314]:
        a.box('PC roof cross rail', (0, y, .867), (.348, .072, .016), white, .003)
    batch_boxes(a, 'PC open roof ventilation ribs',
                [((-.16 + i * .013333, 0, .867), (.004, .54, .006)) for i in range(25)], frame)
    a.box('PC AIO radiator body', (0, .025, .817), (.31, .53, .026), frame, .003)
    batch_boxes(a, 'PC radiator cooling fins',
                [((0, -.225 + i * .017, .834), (.27, .003, .009)) for i in range(30)], heatsink)
    for i, y in enumerate([-.13, .13]):
        build_fan(a.root, 'radiator_' + str(i), (0, y, .790), .24, frame, rotor, silver, rotation=(math.pi / 2, 0, 0))
    a.cylinder('PC power button', (.195, -.265, .878), .012, .005, silver, bevel=.001)
    for y in [-.20, -.155]:
        a.box('PC top USB port', (.195, y, .877), (.016, .026, .003), rubber, .001)

    # Back panel has an exhaust opening, I/O bank and expansion slots.
    a.box('PC rear PSU panel', (0, .346, .15), (.432, .012, .18), white, .003)
    a.box('PC rear expansion frame', (0, .346, .38), (.432, .012, .24), frame, .003)
    for z in [.30 + i * .030 for i in range(6)]:
        a.box('PC rear expansion slot', (-.045, .354, z), (.30, .004, .012), silver, .001)
    a.box('PC rear motherboard IO plate', (.14, .346, .66), (.13, .012, .32), white, .003)
    a.box('PC rear upper cross rail', (0, .346, .841), (.416, .012, .038), white, .003)
    a.box('PC rear fan upper bridge', (-.055, .346, .811), (.26, .012, .020), white, .002)
    a.box('PC rear fan lower bridge', (-.055, .346, .519), (.26, .012, .038), white, .002)
    a.box('PC rear fan side bridge', (-.196, .346, .67), (.020, .012, .26), white, .002)
    a.box('PC rear PSU cross rail', (0, .346, .250), (.432, .012, .020), white, .002)
    for z in [.57, .61, .65, .70, .74]:
        a.box('PC rear USB and display sockets', (.14, .354, z), (.055, .004, .014), rubber, .001)
    build_fan(a.root, 'rear_exhaust', (-.055, .334, .67), .26, frame, rotor, silver, rotation=(0, 0, math.pi))
    batch_boxes(a, 'PC PSU exhaust grille', [((-.12 + i * .02, .354, .16), (.008, .004, .095)) for i in range(13)], frame)
    a.box('PC PSU power inlet', (.155, .354, .10), (.045, .006, .028), rubber, .003)
    a.box('PC PSU rocker switch', (.155, .354, .15), (.018, .006, .027), rubber, .001)
    a.curve('PC rear mains cable', bezier((.155, .36, .10), (.16, .46, .08), (.20, .48, .004), (.25, .58, .004)), .004, rubber)

    # Motherboard and cooler are mounted against the far-side tray.
    for y in [-.18, .25]:
        for z in [.34, .77]:
            a.cylinder('PC motherboard standoff', (.196, y, z), .004, .036, silver, (0, math.pi / 2, 0))
    a.box('PC motherboard PCB', (.174, .035, .555), (.008, .46, .48), pcb, .002)
    a.box('PC CPU cooler mounting plate', (.165, .09, .64), (.008, .104, .104), frame, .002)
    a.cylinder('PC CPU pump rear collar', (.160, .09, .64), .04, .010, frame, (0, math.pi / 2, 0))
    a.cylinder('PC AIO pump housing', (.147, .09, .64), .052, .025, rotor, (0, math.pi / 2, 0), .002)
    a.cylinder('PC AIO pump front cap', (.131, .09, .64), .045, .006, frame, (0, math.pi / 2, 0))
    a.ring('PC pump indicator rim', (.127, .09, .64), .041, .041, .0015, .001, light)
    a.box('PC VRM heatsink', (.150, .085, .755), (.035, .18, .035), heatsink, .002)
    batch_boxes(a, 'PC VRM heatsink fins', [((.127, .005 + i * .0145, .755), (.016, .004, .031)) for i in range(12)], anodized)
    a.box('PC motherboard rear IO shroud', (.150, .225, .63), (.035, .055, .22), frame, .003)
    a.box('PC M2 heatsink shield', (.158, .05, .456), (.024, .18, .035), anodized, .002)
    a.box('PC chipset heatsink', (.154, -.14, .482), (.028, .075, .070), frame, .002)
    batch_boxes(a, 'PC VRM power stages',
                [((.160, -.002 + i * .027, .717), (.020, .021, .020)) for i in range(7)], rotor)
    traces = finish_material('PC PCB copper traces', (.12, .18, .13), .72, .2)
    batch_boxes(a, 'PC motherboard circuit traces',
                [((.1696, -.15 + i * .025, .54), (.0008, .001, .08)) for i in range(11)], traces)
    for i in range(5):
        a.cylinder('PC motherboard capacitor', (.160, .23, .44 + i * .026), .006, .020, heatsink, (0, math.pi / 2, 0))
    for i, y in enumerate([-.065, -.105]):
        a.box('PC DIMM socket ' + str(i), (.165, y, .65), (.010, .024, .190), frame, .001)
        a.box('PC RAM heatspreader ' + str(i), (.146, y, .65), (.028, .012, .178), rotor, .001)
        a.box('PC RAM diffuser ' + str(i), (.146, y, .741), (.028, .012, .004), light, .001)
    for offset in [-.012, .012]:
        points = bezier((.14, .14 + offset, .67), (-.075, .19 + offset, .71),
                        (-.12, -.15 + offset, .78), (0, -.215 + offset, .812))
        a.curve('PC braided coolant hose', points, .006, rubber)
        a.rod('PC coolant compression fitting', points[0], points[2], .0085, heatsink)

    # A supported graphics card with visible fins, backplate and sleeved power.
    a.box('PC GPU backplate', (0, -.015, .414), (.32, .28, .006), anodized, .003)
    for x in [-.155, .155]:
        a.box('PC GPU flow-through border', (x, .215, .414), (.010, .18, .006), anodized, .001)
    for y in [.13, .30]:
        a.box('PC GPU flow-through end rail', (0, y, .414), (.30, .010, .006), anodized, .001)
    batch_boxes(a, 'PC GPU flow-through grille', [((-.135 + i * .0193, .215, .414), (.004, .16, .006)) for i in range(15)], anodized)
    a.box('PC GPU raised spine', (-.105, -.015, .4185), (.017, .23, .003), heatsink, .001)
    for x in [-.13, .13]:
        for y in [-.125, .10]:
            a.cylinder('PC GPU backplate screw', (x, y, .418), .003, .003, frame, bevel=.0005)
    for x in [-.157, .157]:
        for z in [.351, .392]:
            a.box('PC GPU side rail', (x, .075, z), (.010, .46, .008), rotor, .002)
    for y in [-.155, .305]:
        a.box('PC GPU end cap', (0, y, .372), (.32, .008, .050), rotor, .002)
    batch_boxes(a, 'PC GPU exposed heatsink fins',
                [((-.137, -.14 + i * .0145, .373), (.038, .003, .026)) for i in range(31)], heatsink)
    a.box('PC GPU subtle light strip', (-.164, .075, .398), (.002, .34, .005), light, .001)
    for i, y in enumerate([-.04, .16]):
        build_fan(a.root, 'gpu_' + str(i), (0, y, .342), .124, frame, rotor, silver, rotation=(math.pi / 2, 0, 0))
    a.rod('PC GPU anti-sag support', (-.13, -.115, .251), (-.13, -.115, .35), .005, frame)
    a.box('PC GPU power socket', (-.145, -.04, .419), (.025, .045, .015), frame, .001)
    for i in range(4):
        y = -.055 + i * .009
        a.curve('PC sleeved GPU power lead', bezier((-.145, y, .424), (-.20, y, .39),
                                                 (-.21, .13 + i * .008, .27), (-.15, .13 + i * .008, .252)), .0025, rubber)
    return a.root
