"""Flat ultrawide monitor enclosure and a passive clamp-mounted light bar.

The live image aperture stays at 1.49 x .66, centered on (.1, .979, 1.66).
"""
import math
from desk_accessories import Assembly, finish_material


def rounded_loop(width, height, radius, center_z=0):
    points = []
    for cx, cz, start in [(width / 2 - radius, height / 2 - radius, 0),
                          (-width / 2 + radius, height / 2 - radius, 90),
                          (-width / 2 + radius, -height / 2 + radius, 180),
                          (width / 2 - radius, -height / 2 + radius, 270)]:
        for i in range(9):
            angle = math.radians(start + 90 * i / 8)
            points.append((cx + radius * math.cos(angle), cz + radius * math.sin(angle) + center_z))
    return points


def build_monitor_hardware(silver, diffuser):
    bezel = finish_material('Monitor bezel graphite', (.018, .023, .030), .46, .12)
    polymer = finish_material('Monitor graphite polymer', (.045, .052, .064), .72, .03)
    inset = finish_material('Monitor recessed ports', (.008, .012, .018), .9)
    status = finish_material('Monitor status lens', (.62, .72, .64), .7)
    a = Assembly('MonitorHardwareRoot', (.1, .979, 1.66))

    # A closed continuous frame surrounds, rather than covers, the live image.
    outer = rounded_loop(1.516, .692, .010, -.004)
    inner = rounded_loop(1.49, .66, .004)
    count = len(outer)
    vertices = [(x, y, z) for y in [-.0015, .010] for loop in [outer, inner] for x, z in loop]
    faces = []
    for i in range(count):
        j = (i + 1) % count
        faces.extend([(i, j, count + j, count + i),
                      (2 * count + i, 3 * count + i, 3 * count + j, 2 * count + j),
                      (i, 2 * count + i, 2 * count + j, j),
                      (count + i, count + j, 3 * count + j, 3 * count + i)])
    frame = a.mesh('Monitor continuous front bezel', vertices, faces, bezel)
    for poly in frame.data.polygons:
        if poly.index % 4 < 2:
            poly.use_smooth = False
    edge = frame.modifiers.new('Fine bezel edge radius', 'BEVEL')
    edge.width, edge.segments, edge.limit_method = .0007, 3, 'ANGLE'

    # Thin perimeter transitions into a thicker central electronics pod.
    profiles = [(1.514, .692, .010, .010), (1.520, .696, .018, .012),
                (1.514, .690, .034, .014), (1.460, .635, .043, .025),
                (.860, .430, .068, .055), (.700, .340, .083, .055)]
    vertices = []
    for width, height, depth, radius in profiles:
        vertices.extend((x, depth, z) for x, z in rounded_loop(width, height, radius, -.004))
    faces = [tuple(range(count))]
    for ring in range(len(profiles) - 1):
        for i in range(count):
            j = (i + 1) % count
            faces.append((ring * count + i, (ring + 1) * count + i,
                          (ring + 1) * count + j, ring * count + j))
    faces.append(tuple(reversed(range((len(profiles) - 1) * count, len(profiles) * count))))
    a.mesh('Monitor tapered rear enclosure', vertices, faces, polymer)

    for i in range(18):
        a.box('Monitor rear ventilation slot', (-.255 + i * .030, .084, .103), (.017, .002, .003), inset, .001)
    a.box('Monitor recessed connection bay', (0, .084, -.108), (.27, .004, .046), inset, .005)
    for x in [-.084, -.025, .041]:
        a.box('Monitor metal port surround', (x, .087, -.104), (.028, .003, .011), silver, .001)
        a.box('Monitor port opening', (x, .089, -.104), (.023, .002, .007), inset, .0005)
    a.cylinder('Monitor VESA mounting collar', (0, .095, 0), .065, .026, polymer, (math.pi / 2, 0, 0), .002)
    a.cylinder('Monitor underside joystick', (.51, .025, -.352), .0035, .007, inset)
    a.box('Monitor power indicator lens', (.69, -.0028, -.340), (.003, .0015, .0015), status, .0005)
    build_screenbar(a.root, diffuser)
    return a.root


def build_screenbar(parent, diffuser):
    metal = finish_material('ScreenBar anodized aluminum', (.040, .050, .066), .42, .65)
    end_cap = finish_material('ScreenBar machined end caps', (.075, .085, .105), .36, .55)
    rubber = finish_material('ScreenBar padded grip', (.012, .017, .024), .94)
    a = Assembly('ScreenBarRoot', (0, 0, 0), parent=parent)
    y_center, z_center = -.035, .367

    def d_section(name, x0, x1, radius, mat):
        profile = []
        for i in range(49):
            angle = math.radians(-135 + 270 * i / 48)
            profile.append((y_center + radius * math.sin(angle), z_center + radius * math.cos(angle)))
        vertices = [(x, y, z) for x in [x0, x1] for y, z in profile]
        count = len(profile)
        faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
        for i in range(count):
            j = (i + 1) % count
            faces.append((i, count + i, count + j, j))
        a.mesh(name, vertices, faces, mat)

    d_section('ScreenBar D-section housing', -.420, .420, .013, metal)
    d_section('ScreenBar left end cap', -.428, -.420, .0134, end_cap)
    d_section('ScreenBar right end cap', .420, .428, .0134, end_cap)
    bottom = z_center - .013 * math.sqrt(.5)
    a.box('ScreenBar recessed white diffuser', (0, y_center, bottom - .001), (.780, .012, .002), diffuser, .0008)

    # The rubber pad rests on the rear casing's top edge, clear of the image.
    a.box('ScreenBar monitor contact pad', (0, .018, .345), (.062, .066, .006), rubber, .002)
    a.box('ScreenBar upper clamp', (0, .018, .352), (.065, .068, .010), metal, .003)
    a.box('ScreenBar vertical hinge support', (0, .022, .360), (.033, .024, .020), metal, .003)
    a.box('ScreenBar forward mounting bridge', (0, -.005, .367), (.060, .070, .010), metal, .003)
    a.cylinder('ScreenBar tilt axle', (0, -.018, .367), .009, .070, end_cap, (0, math.pi / 2, 0), .001)
    a.box('ScreenBar counterweight bracket', (0, .058, .348), (.052, .040, .010), metal, .002)
    a.cylinder('ScreenBar rear counterweight', (0, .075, .322), .024, .056, metal, (0, math.pi / 2, 0), .003)
    a.box('ScreenBar rear rubber bumper', (0, .049, .322), (.050, .004, .030), rubber, .002)
    a.box('ScreenBar USB-C connector', (0, .101, .320), (.011, .003, .005), rubber, .001)
    a.curve('ScreenBar flexible power cable', [(0, .104, .320), (0, .140, .290),
                                             (.025, .140, .100), (.030, .120, -.120)], .0021, rubber)
    return a.root
