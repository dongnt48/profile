"""High-detail DongOS 3D Isometric Workspace Room.
Run: D:\\Blender\\blender.exe --background --python blender/build_room.py
All meshes and procedural textures are authored here; no third-party model licenses needed.
Blender coordinates: X right, Y toward back wall, Z up. glTF exports Y up.
"""
import bpy, math, random, os, sys
from mathutils import Vector, Euler
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mouse import build_mouse
from desk_accessories import build_speakers, build_headphones, build_desk_lamp
from monitor_hardware import build_monitor_hardware
from pc_tower import build_pc_tower

random.seed(42)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for path in ['public/models', 'public/images', 'public/textures', 'blender']:
    os.makedirs(os.path.join(ROOT, path), exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, rough=.5, metal=0.0, emission=0.0, alpha=1.0, emission_color=None):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, alpha)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, alpha)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if 'Specular IOR Level' in p.inputs:
        p.inputs['Specular IOR Level'].default_value = 0.55
    if emission:
        ec = emission_color if emission_color else color
        p.inputs['Emission Color'].default_value = (*ec, 1)
        p.inputs['Emission Strength'].default_value = emission
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha
        if hasattr(m, 'surface_render_method'):
            m.surface_render_method = 'DITHERED'
    return m

def textured(name, base, kind='wood', rough=.52, metal=0.0, emission=0.0):
    m = material(name, base, rough, metal, emission=emission)
    size = 512
    img = bpy.data.images.new(name + ' texture', width=size, height=size)
    pixels = [0.0] * (size * size * 4)
    idx = 0
    for y in range(size):
        fy = y / size
        for x in range(size):
            fx = x / size
            if kind == 'wood':
                # Longitudinal hardwood grain running along X (plank length)
                warp = math.sin(fx * 3.8 + math.sin(fy * 5.2) * 0.65) * 0.18
                fiber = math.sin((fy + warp) * 125.0 + math.sin(fx * 9.0) * 1.4) * 0.026
                cathedral = math.sin((fy - 0.5) * 26.0 + math.cos(fx * 4.5) * 2.2) * 0.028
                pore = -0.022 if ((x * 7 + y * 31) % 97 == 0) else 0.0
                noise = (random.random() - 0.5) * 0.022
                n = 0.94 + fiber + cathedral + pore + noise
                c = [max(0.0, min(1.0, ch * n)) for ch in base]
            elif kind == 'rug':
                # Deep Oceanic Bauhaus geometric rug (Mệnh Thủy: Navy, Cobalt, Slate Silver Grey & Pearl White)
                gx = fx * 3.0
                gy = fy * 2.0
                block_x = int(gx)
                block_y = int(gy)
                sub_d = math.hypot(fx - 0.5, fy - 0.5)
                if (block_x == 0 and block_y == 1) or (block_x == 2 and block_y == 0):
                    # Deep Oceanic Navy
                    r_c, g_c, b_c = 0.08, 0.14, 0.25
                elif (block_x == 1 and block_y == 0) or (block_x == 0 and block_y == 0 and fx < 0.2):
                    # Slate Silver Grey
                    r_c, g_c, b_c = 0.46, 0.52, 0.60
                elif (block_x == 1 and block_y == 1) or (sub_d < 0.22):
                    # Cobalt / Steel Blue
                    r_c, g_c, b_c = 0.15, 0.28, 0.46
                else:
                    # Crisp Pearl White
                    r_c, g_c, b_c = 0.93, 0.95, 0.97
                border = (fx < 0.035 or fx > 0.965 or fy < 0.045 or fy > 0.955)
                if border:
                    r_c, g_c, b_c = 0.08, 0.14, 0.25
                boucle = 0.024 * math.sin(x * 2.2) * math.cos(y * 2.2) + (random.random() - 0.5) * 0.02
                c = [max(0.0, min(1.0, r_c + boucle)), max(0.0, min(1.0, g_c + boucle)), max(0.0, min(1.0, b_c + boucle))]
            elif kind == 'mesh':
                # Resolve the weave at close range; mipmaps soften it at room scale.
                u_cell = (fx * 48.0) % 1.0 - 0.5
                v_cell = (fy * 48.0) % 1.0 - 0.5
                hole = max(0.0, 1.0 - math.hypot(u_cell * 2.1, v_cell * 1.8) * 1.8)
                tension_rib = math.exp(-((v_cell * 3.6) ** 2)) * 0.14
                fiber = 0.05 * math.sin(fx * 240.0) * math.cos(fy * 200.0)
                sheen = 0.94 + tension_rib * .3 + fiber * .25
                c = [max(0.0, min(1.0, ch * sheen)) for ch in base]
            elif kind == 'mouse_grip':
                # Precision diamond tactile rubber grip pattern
                d1 = (fx * 60.0 + fy * 60.0) % 1.0 - 0.5
                d2 = (fx * 60.0 - fy * 60.0) % 1.0 - 0.5
                diamond = max(0.0, 1.0 - (abs(d1) + abs(d2)) * 1.7)
                grain = (random.random() - 0.5) * 0.03
                n = 0.82 + diamond * 0.32 + grain
                c = [max(0.0, min(1.0, ch * n)) for ch in base]
            elif kind == 'speaker_grille':
                # CNC laser-drilled aluminum acoustic speaker micro-dots
                gx = (fx * 40.0) % 1.0 - 0.5
                gy = (fy * 120.0) % 1.0 - 0.5
                dot = 1.0 if math.hypot(gx, gy) < 0.28 else 0.0
                n = 0.88 - dot * 0.65
                c = [max(0.0, min(1.0, ch * n)) for ch in base]
            elif kind == 'landscape':
                # Photorealistic golden-hour cloudscape, atmospheric mist & forested mountain valley
                r = 0.90 - 0.34 * fy
                g = 0.74 + 0.06 * (1.0 - abs(fy - 0.48)) - 0.16 * fy
                b = 0.56 + 0.28 * fy
                sun_d = math.hypot((fx - 0.34) * 1.45, fy - 0.60)
                if sun_d < 0.36:
                    glow = ((0.36 - sun_d) / 0.36) ** 1.8
                    r = min(1.0, r + 0.24 * glow)
                    g = min(1.0, g + 0.17 * glow)
                    b = min(1.0, b + 0.08 * glow)
                # Multi-octave atmospheric clouds in upper sky
                if fy > 0.38:
                    c_n = (
                        math.sin(fx * 9.0 + math.cos(fy * 6.0) * 1.4) * 0.5
                        + math.cos(fx * 21.0 - fy * 14.0) * 0.3
                        + math.sin(fx * 43.0 + fy * 31.0) * 0.2
                    )
                    cloud = max(0.0, c_n - 0.12) * max(0.0, min(1.0, (fy - 0.42) * 3.0))
                    r = min(1.0, r + cloud * 0.16)
                    g = min(1.0, g + cloud * 0.11)
                    b = min(1.0, b + cloud * 0.06)
                treeline = 0.008 * math.sin(fx * 190.0) + 0.005 * math.cos(fx * 340.0)
                m_far = 0.49 + 0.075 * math.sin(fx * 5.2 + 0.5) + 0.032 * math.cos(fx * 13.0) + treeline * 0.4
                m_mid = 0.36 + 0.065 * math.sin(fx * 7.4 + 2.1) + 0.028 * math.sin(fx * 18.0) + treeline * 0.7
                m_near = 0.23 + 0.045 * math.cos(fx * 9.5 + 1.2) + 0.022 * math.sin(fx * 29.0) + treeline
                if fy < m_far:
                    mist = max(0.0, (m_far - fy) / 0.18)
                    r, g, b = 0.52 - 0.10 * mist, 0.54 - 0.08 * mist, 0.49 - 0.06 * mist
                if fy < m_mid:
                    mist = max(0.0, (m_mid - fy) / 0.16)
                    r, g, b = 0.34 - 0.07 * mist, 0.39 - 0.06 * mist, 0.33 - 0.05 * mist
                if fy < m_near:
                    canopy = 0.018 * math.sin(fx * 140.0 + fy * 90.0)
                    r, g, b = 0.17 + canopy, 0.24 + canopy * 1.2, 0.18 + canopy * 0.8
                c = [max(0.0, min(1.0, r)), max(0.0, min(1.0, g)), max(0.0, min(1.0, b))]
            elif kind == 'leaf':
                # Botanical leaf with central midrib vein, lateral veins & margin gradient
                dx = abs(fx - 0.5) * 2.0
                midrib = math.exp(-((dx * 16.0) ** 2)) * (1.0 - fy * 0.35)
                lat_phase = (fy * 11.0 - dx * 5.2) % 1.0
                lat_vein = math.exp(-(((lat_phase - 0.5) * 5.5) ** 2)) * (1.0 - dx * 0.7) * 0.45
                vein = max(midrib, lat_vein)
                edge_darken = 1.0 - 0.18 * (dx ** 1.6) - 0.08 * ((fy - 0.5) ** 2)
                micro = (random.random() - 0.5) * 0.025
                c = [
                    max(0.0, min(1.0, base[0] * edge_darken + vein * 0.09 + micro)),
                    max(0.0, min(1.0, base[1] * edge_darken + vein * 0.13 + micro)),
                    max(0.0, min(1.0, base[2] * edge_darken + vein * 0.05 + micro)),
                ]
            elif kind == 'stone':
                # Authentic Seiryu / Ryuoh stone: dark slate gray with sharp white quartz veins & deep weathered crevices
                v1 = math.sin(fx * 24.0 + math.cos(fy * 16.0) * 2.8)
                v2 = math.cos(fx * 42.0 - fy * 32.0)
                vein_dist = abs(v1 * 0.65 + v2 * 0.35)
                is_quartz = vein_dist < 0.075
                fissure = math.exp(-((vein_dist / 0.045) ** 2))
                micro = (random.random() - 0.5) * 0.035
                if is_quartz:
                    r = min(1.0, 0.74 + micro * 2.0)
                    g = min(1.0, 0.78 + micro * 2.0)
                    b = min(1.0, 0.80 + micro * 2.0)
                else:
                    strata = 0.88 + 0.16 * math.sin(fx * 9.0 + fy * 12.0) - fissure * 0.32 + micro
                    r = max(0.0, min(1.0, base[0] * strata))
                    g = max(0.0, min(1.0, base[1] * strata))
                    b = max(0.0, min(1.0, base[2] * strata))
                c = [r, g, b]
            elif kind == 'aquasoil':
                # Volcanic granular ADA Amazonia aqua soil beads (2-4mm dark rounded granules)
                gx = (fx * 85.0) % 1.0 - 0.5
                gy = (fy * 85.0) % 1.0 - 0.5
                bead = max(0.0, 1.0 - math.hypot(gx, gy) * 1.9)
                noise = (random.random() - 0.5) * 0.04
                n = 0.76 + bead * 0.42 + noise
                c = [max(0.0, min(1.0, base[0] * n)), max(0.0, min(1.0, base[1] * n)), max(0.0, min(1.0, base[2] * n))]
            elif kind == 'aquasand':
                # Fine ADA La Plata river cosmetic sand with subtle golden pebble speckles
                speckle = 0.08 if ((int(fx * 240) ^ int(fy * 240)) % 17 == 0) else 0.0
                wave = math.sin(fx * 16.0 + fy * 8.0) * 0.025
                noise = (random.random() - 0.5) * 0.025
                n = 0.98 + speckle + wave + noise
                c = [max(0.0, min(1.0, base[0] * n)), max(0.0, min(1.0, base[1] * n)), max(0.0, min(1.0, base[2] * n))]
            elif kind == 'neontetra':
                # Authentic Cardinal / Neon Tetra coloration:
                # fx: 0.0 = snout (+X), 1.0 = tail (-X)
                # fy: 0.0 = belly (-Z), 1.0 = dorsal ridge (+Z)
                dorsal_blend = max(0.0, min(1.0, (fy - 0.62) / 0.38))
                r_base = 0.12 * (1.0 - dorsal_blend) + 0.15 * dorsal_blend
                g_base = 0.16 * (1.0 - dorsal_blend) + 0.22 * dorsal_blend
                b_base = 0.18 * (1.0 - dorsal_blend) + 0.16 * dorsal_blend

                # Silvery pearl belly with metallic sheen
                belly_blend = max(0.0, min(1.0, (0.50 - fy) / 0.50)) * max(0.0, 1.0 - fx * 0.75)
                r = r_base * (1.0 - belly_blend) + 0.84 * belly_blend
                g = g_base * (1.0 - belly_blend) + 0.88 * belly_blend
                b = b_base * (1.0 - belly_blend) + 0.90 * belly_blend

                # Vivid scarlet red tail & lower flank (soft natural falloff)
                if fx > 0.35:
                    red_x = max(0.0, min(1.0, (fx - 0.35) / 0.38))
                    red_y = max(0.0, min(1.0, 1.0 - abs(fy - 0.36) / 0.32))
                    red_int = math.sin(red_x * math.pi * 0.5) * math.sin(red_y * math.pi * 0.5)
                    r = r * (1.0 - red_int) + 0.95 * red_int
                    g = g * (1.0 - red_int) + 0.12 * red_int
                    b = b * (1.0 - red_int) + 0.16 * red_int

                # Brilliant glowing electric-blue/cyan lateral stripe
                stripe_center_y = 0.58 + (fx - 0.45) * 0.04
                dist_to_stripe = abs(fy - stripe_center_y)
                if 0.10 < fx < 0.86 and dist_to_stripe < 0.075:
                    stripe_core = (1.0 - dist_to_stripe / 0.075) ** 1.8
                    stripe_fade = math.sin(max(0.0, min(1.0, (fx - 0.10) / 0.76)) * math.pi)
                    neon = stripe_core * stripe_fade
                    r = r * (1.0 - neon) + 0.02 * neon
                    g = g * (1.0 - neon) + 0.88 * neon
                    b = b * (1.0 - neon) + 0.98 * neon

                scale_noise = 0.02 * math.sin(fx * 180.0) * math.cos(fy * 160.0)
                c = [max(0.0, min(1.0, r + scale_noise)), max(0.0, min(1.0, g + scale_noise)), max(0.0, min(1.0, b + scale_noise))]
            elif kind == 'artprint':
                # Fine archival Japanese washi / cotton rag gallery art print
                r, g, b = 0.91, 0.88, 0.82
                grain = (random.random() - 0.5) * 0.025
                paper_fiber = 0.015 * math.sin(fx * 120.0 + math.cos(fy * 80.0) * 1.5)

                # Crisp archival border framing rule
                in_margin = 0.06 < fx < 0.94 and 0.06 < fy < 0.94
                border_line = in_margin and (abs(fx - 0.06) < 0.003 or abs(fx - 0.94) < 0.003 or abs(fy - 0.06) < 0.003 or abs(fy - 0.94) < 0.003)
                if border_line:
                    r, g, b = 0.32, 0.32, 0.30

                # Artwork image field
                if 0.07 < fx < 0.93 and 0.07 < fy < 0.93:
                    # 1. Deep oceanic navy woodblock arch
                    arch_center_x = 0.48
                    arch_base_y = 0.22
                    arch_top_y = 0.54
                    arch_radius = 0.24
                    in_arch_col = abs(fx - arch_center_x) < arch_radius and arch_base_y <= fy <= arch_top_y
                    arch_head_dist = math.hypot(fx - arch_center_x, fy - arch_top_y)
                    in_arch_head = fy > arch_top_y and arch_head_dist < arch_radius

                    if in_arch_col or in_arch_head:
                        woodblock = 0.03 * math.sin(fy * 140.0)
                        r, g, b = 0.12 + woodblock * 0.4, 0.22 + woodblock * 0.5, 0.38

                    # 2. Silver pearl moon sphere
                    sun_dist = math.hypot(fx - 0.65, fy - 0.69)
                    if sun_dist < 0.135:
                        sun_halo = (1.0 - sun_dist / 0.135) * 0.04
                        r, g, b = 0.86 + sun_halo, 0.89 + sun_halo, 0.94

                    # 3. Botanical curved stem and leaves in cobalt blue
                    stem_curve = 0.40 + 0.09 * math.sin(fy * 4.2)
                    if 0.20 < fy < 0.78 and abs(fx - stem_curve) < 0.008:
                        r, g, b = 0.18, 0.32, 0.52
                    for ly_p, side_p, l_size in [(0.28, -1, 0.065), (0.38, 1, 0.072), (0.49, -1, 0.075), (0.60, 1, 0.070), (0.71, -1, 0.060)]:
                        lx_p = 0.40 + 0.09 * math.sin(ly_p * 4.2) + side_p * 0.082
                        leaf_dist = math.hypot((fx - lx_p) * 1.15, (fy - ly_p) * 1.7)
                        if leaf_dist < l_size:
                            leaf_rib = math.exp(-((abs((fx - lx_p) * 1.15) / 0.006) ** 2)) * 0.06
                            r, g, b = 0.22 + leaf_rib, 0.38 + leaf_rib, 0.58

                    # 4. Minimalist typography rules and text layout simulation
                    if 0.178 < fy < 0.182 and 0.14 < fx < 0.86:
                        r, g, b = 0.35, 0.34, 0.32
                    if 0.125 < fy < 0.137 and 0.18 < fx < 0.82 and ((int(fx * 240) % 7) < 5):
                        r, g, b = 0.22, 0.22, 0.22
                    if 0.095 < fy < 0.103 and 0.25 < fx < 0.75 and ((int(fx * 260) % 5) < 4):
                        r, g, b = 0.42, 0.42, 0.40

                c = [max(0.0, min(1.0, ch + grain + paper_fiber)) for ch in (r, g, b)]
            elif kind == 'camera_leather':
                # Tactile black pebble vulcanite camera grip
                pebble = 0.04 * math.sin(fx * 340.0) * math.cos(fy * 340.0)
                grain = (random.random() - 0.5) * 0.03
                base_c = 0.045 + pebble + grain
                c = [max(0.0, min(1.0, base_c)), max(0.0, min(1.0, base_c * 1.05)), max(0.0, min(1.0, base_c * 1.1))]
            else:
                weave = 0.045 * ((x % 4 == 0) or (y % 4 == 0)) - 0.02
                noise = (random.random() - 0.5) * 0.05
                n = 0.95 + weave + noise
                c = [max(0.0, min(1.0, ch * n)) for ch in base]
            pixels[idx] = c[0]
            pixels[idx + 1] = c[1]
            pixels[idx + 2] = c[2]
            pixels[idx + 3] = (0.0 if hole > .2 else 1.0) if kind == 'mesh' else 1.0
            idx += 4
    img.pixels = pixels
    img.filepath_raw = os.path.join(ROOT, 'public/textures', name.lower().replace(' ', '-') + '.png')
    img.file_format = 'PNG'
    img.save()
    img.pack()
    tex = m.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = img
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    m.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    if kind == 'mesh':
        m.node_tree.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
        m.surface_render_method = 'DITHERED'
        m.use_backface_culling = False
    if emission:
        m.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])
    return m

# Palette & PBR Materials (Concept: Deep Oceanic & Silver Tech - Mệnh Thủy)
walnut = textured('Walnut grain', (.85, .83, .79), 'wood', rough=.62)
dark_walnut = material('Walnut dark', (.78, .76, .72), .60)
floorwood = [
    textured('Oak grain 0', (.84, .82, .78), 'wood', rough=.65),
    textured('Oak grain 1', (.86, .84, .80), 'wood', rough=.65),
    textured('Oak grain 2', (.82, .80, .76), 'wood', rough=.67),
]
wall = material('Sand plaster', (.97, .97, .97), .92)
edge = material('Walnut edges', (.82, .80, .76), .62)
black = material('Graphite powder coat', (.16, .18, .22), .48, .25)
dark_grey = material('Anodized slate', (.22, .26, .32), .42, .45)
silver = material('Brushed aluminum', (.82, .84, .86), .28, .85)
brass = material('Brushed brass', (.84, .86, .88), .20, .92)
copper = material('Burnished copper', (.80, .83, .86), .25, .85)
cloth = textured('Olive upholstery', (.10, .16, .28), 'fabric', rough=.80)
chair_mesh_grey = material('Chair mesh grey', (.68, .72, .76), .68)
deskmat_mat = material('Desk felt mat', (.09, .14, .25), .84)
rug = textured('Woven wool', (.16, .24, .38), 'rug', rough=.85)
leaf = textured('Leaf olive', (.18, .34, .16), 'leaf', rough=.42)
lightleaf = textured('Leaf sage', (.32, .48, .22), 'leaf', rough=.40)
darkleaf = textured('Leaf deep', (.12, .25, .11), 'leaf', rough=.38)
redplant = material('Aquatic red stem', (.72, .28, .22), .55)
terracotta = material('Matte ceramic', (.92, .94, .96), .68)
cream_ceramic = material('Cream ceramic', (.95, .96, .97), .42)
soil = material('Potting soil', (.12, .09, .06), .95)
amber = material('Warm LED', (.98, .75, .42), .25, emission=3.8)
cool_led = material('Aquarium WRGB', (.90, .98, 1.0), .2, emission=3.4)
screenbar_led = material('Monitor task light', (.90, .98, 1.0), .65)
screen = material('Monitor glass', (.10, .16, .12), .16, emission=.62)
water = material('Water clear teal', (.24, .82, .72), .03, alpha=.16)
glass = material('Aquarium glass', (.82, .96, .92), .02, alpha=.08)
gravel = textured('Aquarium substrate', (.24, .21, .16), 'aquasoil', rough=.88)
sand_mat = textured('Aquarium sand path', (.94, .94, .90), 'aquasand', rough=.76)
rock_mat = textured('Seiryu stone', (.36, .38, .42), 'stone', rough=.82)
driftwood_mat = textured('Driftwood', (.38, .30, .22), 'wood', rough=.72)
moss_mat = textured('Aquarium moss', (.16, .32, .14), 'leaf', rough=.55)
fishmat = textured('Neon tetra', (.12, .18, .22), 'neontetra', rough=.32, metal=.35, emission=0.15)
fish_fin_mat = material('Translucent fin', (.82, .94, .92), rough=.15, alpha=.35)
fish_iris_mat = material('Fish iris', (.86, .84, .76), rough=.2, metal=.85)
curtainmat = textured('Linen curtain', (.10, .15, .25), 'fabric', rough=.80)
white = material('Warm paper', (.96, .96, .96), .78)
case_white = material('PC case white', (.96, .96, .96), .42, .12)
chair_frame_white = material('Chair frame white', (.80, .82, .85), .40, .35)
armrest_grey = material('Armrest grey', (.22, .26, .32), .65)
key_matcha = material('Keycap matcha', (.10, .16, .28), .65)
key_butter = material('Keycap butter', (.18, .38, .65), .65)
key_cream = material('Keycap cream', (.94, .95, .96), .65)

# High-Tech Full Mesh, MX Master 3S Mouse & Precision MacBook Materials
pellicle_navy = textured('Pellicle mesh navy', (.10, .16, .28), 'mesh', rough=.60)
pellicle_smoke = textured('Pellicle mesh smoke', (.62, .66, .72), 'mesh', rough=.60)
mouse_mat = textured('Mouse grip slate', (.14, .17, .22), 'mouse_grip', rough=.75)
mouse_body = material('Mouse body slate', (.16, .19, .24), .45, .15)
mouse_wheel_steel = material('Mouse wheel steel', (.82, .85, .88), .18, .92)
spk_grille_mat = textured('Laptop speaker grille', (.70, .72, .75), 'speaker_grille', rough=.55, metal=.70)
laptop_chassis = material('MacBook aluminum', (.84, .86, .88), .30, .85)
laptop_keyboard_well = material('Laptop keyboard well', (.09, .11, .13), .65)
laptop_keycap = material('Laptop keycap', (.12, .14, .16), .55)
laptop_trackpad_mat = material('Force touch trackpad', (.82, .84, .87), .22, .65)
display_bezel = material('Display glass bezel', (.04, .05, .06), .10, .15)
monitor_housing = material('Monitor chassis dark', (.12, .14, .18), .45, .2)
vesa_glow = material('VESA bias light', (.88, .94, 1.0), .2, emission=3.2)

# Rich Bookbinding, Camera & Gallery Art Materials
book_cloth_olive = textured('Book cloth olive', (.10, .16, .28), 'fabric', rough=.80)
book_leather_cognac = material('Book leather cognac', (.18, .24, .36), rough=.60, metal=.08)
book_cloth_navy = textured('Book cloth navy', (.08, .14, .24), 'fabric', rough=.80)
book_cloth_terracotta = material('Book cloth terracotta', (.16, .26, .42), rough=.78)
book_paper_sand = material('Book paper sand', (.92, .93, .95), rough=.82)
book_cloth_charcoal = material('Book cloth charcoal', (.16, .18, .22), rough=.85)
book_ochre = material('Book ochre', (.22, .34, .52), rough=.75)
book_pages_mat = material('Book pages cream', (.96, .96, .96), rough=.88)
foil_gold = material('Foil gold', (.86, .88, .92), rough=.25, metal=.90)
foil_silver = material('Foil silver', (.88, .90, .94), rough=.22, metal=.94)
foil_blind = material('Foil blind', (.12, .14, .18), rough=.75)
ribbon_gold = material('Book ribbon gold', (.88, .90, .94), rough=.35)
ribbon_burgundy = material('Book ribbon burgundy', (.22, .36, .58), rough=.45)
bookmats = [book_cloth_olive, book_cloth_terracotta, book_paper_sand, book_cloth_navy, book_ochre]

cam_chrome = material('Camera chrome', (.84, .86, .88), rough=.18, metal=.90)
cam_leather = textured('Camera leatherette', (.06, .065, .068), 'camera_leather', rough=.88)
cam_lens_glass = material('Lens glass', (.15, .75, .65), rough=.02, metal=.15, alpha=.22)
red_enamel = material('Red enamel', (.88, .08, .08), rough=.18, metal=.15)
leather_strap_mat = material('Camera leather strap', (.16, .22, .32), rough=.68)
picture_glass_mat = material('Picture glass', (.90, .95, .94), rough=.02, metal=.05, alpha=.08)
lamp_sage = material('Mushroom lamp sage', (.10, .16, .28), rough=.35, metal=.15)

def finish(obj, name, mat):
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    return obj

def box(name, pos, dims, mat, bevel=.018, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos, rotation=rot)
    obj = bpy.context.object
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(obj, name, mat)
    if bevel:
        mod = obj.modifiers.new('Soft edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return obj

def cylinder(name, pos, radius, depth, mat, vertices=28, rot=(0, 0, 0), bevel=.006):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=pos, rotation=rot)
    obj = finish(bpy.context.object, name, mat)
    for p in obj.data.polygons:
        p.use_smooth = True
    if bevel:
        mod = obj.modifiers.new('Edge bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        obj.modifiers.new('Normals', 'WEIGHTED_NORMAL')
    return obj

def sphere(name, pos, scale, mat, segments=20, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=12, location=pos, rotation=rot)
    obj = finish(bpy.context.object, name, mat)
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj

def rod(name, a, b, radius, mat, vertices=16):
    a, b = Vector(a), Vector(b)
    obj = cylinder(name, (a + b) / 2, radius, (b - a).length, mat, vertices, bevel=.002)
    obj.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()
    return obj

def curve(name, points, radius, mat, res=3):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.bevel_depth = radius
    data.bevel_resolution = res
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for p, co in zip(spline.bezier_points, points):
        p.co = co
        p.handle_left_type = 'AUTO'
        p.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(mat)
    return obj


def suspension_mesh(name, rim, mat, axis='back', sag=.018):
    """Tensioned, UV-mapped membrane tucked into the actual curved frame."""
    from mathutils.geometry import interpolate_bezier
    bpy.context.view_layer.update()
    points = rim.data.splines[0].bezier_points
    boundary = []
    for a, b in zip(points, list(points)[1:]):
        boundary.extend(interpolate_bezier(a.co, a.handle_right, b.handle_left, b.co, 9)[:-1])
    center = sum(boundary, Vector()) / len(boundary)
    normal = Vector((0, 0, -1) if axis == 'seat' else (0, 1, 0))
    verts = [center + normal * sag]
    count, rings = len(boundary), 8
    for ring in range(1, rings + 1):
        t = ring / rings
        for point in boundary:
            # End inside the frame tube so no rectangular corners or open seams remain.
            edge = point.lerp(center, .018 / max(.018, (point - center).length))
            verts.append(center.lerp(edge, t) + normal * sag * (1 - t * t))
    faces = [(0, 1 + i, 1 + (i + 1) % count) for i in range(count)]
    for ring in range(rings - 1):
        a, b = 1 + ring * count, 1 + (ring + 1) * count
        faces.extend((a + i, b + i, b + (i + 1) % count, a + (i + 1) % count) for i in range(count))
    if axis == 'seat':
        faces = [tuple(reversed(face)) for face in faces]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name='UVMap')
    v_axis = 1 if axis == 'seat' else 2
    x_min, x_max = min(p.x for p in boundary), max(p.x for p in boundary)
    v_min, v_max = min(p[v_axis] for p in boundary), max(p[v_axis] for p in boundary)
    for poly in mesh.polygons:
        poly.use_smooth = True
        for index in poly.loop_indices:
            p = mesh.vertices[mesh.loops[index].vertex_index].co
            uv.data[index].uv = ((p.x - x_min) / (x_max - x_min), (p[v_axis] - v_min) / (v_max - v_min))
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj

def leafmesh(name, pos, scale, angle=0, tilt=.25, mat=leaf):
    verts = [
        (0, 0, 0),
        (-.22, .16, .04),
        (-.36, .38, .07),
        (-.38, .62, .05),
        (-.25, .84, .01),
        (0, 1.08, -.06),
        (.25, .84, .01),
        (.38, .62, .05),
        (.36, .38, .07),
        (.22, .16, .04),
        (0, .34, .11),
        (0, .70, .06),
    ]
    faces = [
        (0, 1, 10), (1, 2, 10), (2, 3, 11, 10), (3, 4, 11), (4, 5, 11),
        (5, 6, 11), (6, 7, 11), (7, 8, 10, 11), (8, 9, 10), (9, 0, 10),
    ]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv_layer = mesh.uv_layers.new(name='UVMap')
    for poly in mesh.polygons:
        poly.use_smooth = True
        for loop_idx in poly.loop_indices:
            v_co = mesh.vertices[mesh.loops[loop_idx].vertex_index].co
            uv_layer.data[loop_idx].uv = (v_co.x / 0.76 + 0.5, max(0.0, min(1.0, v_co.y / 1.08)))
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    obj.scale = (scale, scale, scale)
    obj.rotation_euler = (tilt + random.uniform(-.10, .10), random.uniform(-.12, .12), angle)
    obj.data.materials.append(mat)
    solid = obj.modifiers.new('Leaf thickness', 'SOLIDIFY')
    solid.thickness = .008
    return obj

def pot(pos, r=.18, h=.25, mat=terracotta, rim=True):
    x, y, z = pos
    bpy.ops.mesh.primitive_cone_add(vertices=36, radius1=r * .78, radius2=r, depth=h, location=(x, y, z + h / 2))
    obj = finish(bpy.context.object, 'Ceramic planter', mat)
    for p in obj.data.polygons:
        p.use_smooth = True
    if rim:
        bpy.ops.mesh.primitive_torus_add(major_radius=r * .98, minor_radius=r * .07, major_segments=36, minor_segments=12, location=(x, y, z + h - .01))
        finish(bpy.context.object, 'Planter rim', mat)
    cylinder('Planter saucer', (x, y, z + .012), r * .86, .024, edge, 36)
    cylinder('Visible soil', (x, y, z + h - .012), r * .92, .02, soil, 32)
    return z + h

def seiryu_crag(name, pos, scale, mat, rot=(0, 0, 0), seed_i=0):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=pos, rotation=rot)
    obj = finish(bpy.context.object, name, mat)
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    rnd = random.Random(seed_i + 200)
    for v in obj.data.vertices:
        # Sharp angular strata ridges & geological fissures
        strata = math.sin(v.co.z * 16.0 + v.co.x * 8.0) * 0.10
        chip = rnd.uniform(-0.08, 0.08)
        fissure = -0.12 if (abs(v.co.x * 3.0 - v.co.z * 2.0) < 0.15) else 0.0
        crag = 1.0 + strata + chip + fissure
        v.co.x *= crag
        v.co.y *= crag
        v.co.z *= (1.0 + rnd.uniform(-0.05, 0.05))
    obj.data.update()
    uv_layer = obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap')
    for poly in obj.data.polygons:
        poly.use_smooth = True
        for loop_idx in poly.loop_indices:
            co = obj.data.vertices[obj.data.loops[loop_idx].vertex_index].co
            uv_layer.data[loop_idx].uv = (co.x * 2.5 + 0.5, co.z * 2.5 + 0.5)
    return obj

def create_tetra(name, mat, fin_mat, eye_ring_mat, pupil_mat):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)

    # 1. Slender hydrodynamic fish body mesh (~9cm long, 2.4cm high, 1.4cm wide)
    b_mesh = bpy.data.meshes.new(name + '_BodyMesh')
    rings = [
        (0.040, 0.0014, 0.0014),
        (0.029, 0.0048, 0.0073),
        (0.014, 0.0065, 0.0108),
        (0.000, 0.0070, 0.0120),
        (-0.015, 0.0053, 0.0095),
        (-0.030, 0.0030, 0.0056),
        (-0.041, 0.0012, 0.0026),
    ]
    verts = []
    num_s = 12
    for rx, ry, rz in rings:
        for s in range(num_s):
            ang = s * math.tau / num_s
            verts.append((rx, math.sin(ang) * ry, math.cos(ang) * rz))
    # Snout apex
    verts.append((0.044, 0, 0))
    snout_idx = len(verts) - 1

    faces = []
    for s in range(num_s):
        faces.append((snout_idx, (s + 1) % num_s, s))
    for r in range(len(rings) - 1):
        r1 = r * num_s
        r2 = (r + 1) * num_s
        for s in range(num_s):
            s_next = (s + 1) % num_s
            faces.append((r1 + s, r1 + s_next, r2 + s_next, r2 + s))

    b_mesh.from_pydata(verts, [], faces)
    b_mesh.update()
    uv = b_mesh.uv_layers.new(name='UVMap')
    for poly in b_mesh.polygons:
        poly.use_smooth = True
        for loop_idx in poly.loop_indices:
            co = b_mesh.vertices[b_mesh.loops[loop_idx].vertex_index].co
            fx = max(0.0, min(1.0, (0.044 - co.x) / 0.085))
            fy = max(0.0, min(1.0, (co.z + 0.012) / 0.024))
            uv.data[loop_idx].uv = (fx, fy)

    body_obj = bpy.data.objects.new('Fish body', b_mesh)
    bpy.context.collection.objects.link(body_obj)
    body_obj.data.materials.append(mat)
    body_obj.parent = root

    # 2. Forked Caudal Tail Fin (Parented to root so it waggles in Three.js)
    t_mesh = bpy.data.meshes.new(name + '_TailMesh')
    t_verts = [
        (-0.041, 0, 0.000),      # Peduncle base
        (-0.058, 0, 0.016),      # Upper fin lobe tip
        (-0.050, 0, 0.001),      # Central fork notch
        (-0.058, 0, -0.016),     # Lower fin lobe tip
    ]
    t_faces = [(0, 1, 2), (0, 2, 3)]
    t_mesh.from_pydata(t_verts, [], t_faces)
    t_mesh.update()
    tail_obj = bpy.data.objects.new('Fish tail', t_mesh)
    bpy.context.collection.objects.link(tail_obj)
    tail_obj.data.materials.append(fin_mat)
    tail_obj.parent = root
    mod1 = tail_obj.modifiers.new('Solid', 'SOLIDIFY')
    mod1.thickness = 0.0007

    # 3. Delicate Dorsal fin
    d_mesh = bpy.data.meshes.new(name + '_DorsalMesh')
    d_verts = [
        (-0.003, 0, 0.0120),
        (-0.018, 0, 0.0095),
        (-0.020, 0, 0.0230),
        (-0.010, 0, 0.0245),
    ]
    d_faces = [(0, 1, 2, 3)]
    d_mesh.from_pydata(d_verts, [], d_faces)
    d_mesh.update()
    dorsal_obj = bpy.data.objects.new('Fish dorsal', d_mesh)
    bpy.context.collection.objects.link(dorsal_obj)
    dorsal_obj.data.materials.append(fin_mat)
    dorsal_obj.parent = root
    mod2 = dorsal_obj.modifiers.new('Solid', 'SOLIDIFY')
    mod2.thickness = 0.0007

    # 4. Anal fin
    a_mesh = bpy.data.meshes.new(name + '_AnalMesh')
    a_verts = [
        (-0.015, 0, -0.0095),
        (-0.031, 0, -0.0056),
        (-0.035, 0, -0.0148),
        (-0.020, 0, -0.0162),
    ]
    a_faces = [(0, 1, 2, 3)]
    a_mesh.from_pydata(a_verts, [], a_faces)
    a_mesh.update()
    anal_obj = bpy.data.objects.new('Fish anal', a_mesh)
    bpy.context.collection.objects.link(anal_obj)
    anal_obj.data.materials.append(fin_mat)
    anal_obj.parent = root
    mod3 = anal_obj.modifiers.new('Solid', 'SOLIDIFY')
    mod3.thickness = 0.0006

    # 5. Pectoral fins
    for side, ang in [(-1, -0.35), (1, 0.35)]:
        p_mesh = bpy.data.meshes.new(name + '_PectoralMesh')
        p_verts = [
            (0.018, 0, -0.0025),
            (0.003, 0, -0.011),
            (0.009, 0, -0.015),
        ]
        p_faces = [(0, 1, 2)]
        p_mesh.from_pydata(p_verts, [], p_faces)
        p_mesh.update()
        p_obj = bpy.data.objects.new('Fish pectoral', p_mesh)
        bpy.context.collection.objects.link(p_obj)
        p_obj.data.materials.append(fin_mat)
        p_obj.location = (0, side * 0.0060, -0.0032)
        p_obj.rotation_euler = (0, 0.25, ang)
        p_obj.parent = root
        mod4 = p_obj.modifiers.new('Solid', 'SOLIDIFY')
        mod4.thickness = 0.0006

    # 6. Eyes with obsidian pupil and pearl-silver iris ring
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=0.0035, location=(0.029, side * 0.0048, 0.0026))
        eye = bpy.context.object
        eye.name = 'Fish eye ring'
        eye.data.materials.append(eye_ring_mat)
        eye.scale = (1, 0.45, 1)
        bpy.ops.object.transform_apply(scale=True)
        eye.parent = root

        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.0022, location=(0.029, side * 0.0059, 0.0026))
        pupil = bpy.context.object
        pupil.name = 'Fish pupil'
        pupil.data.materials.append(pupil_mat)
        pupil.scale = (1, 0.35, 1)
        bpy.ops.object.transform_apply(scale=True)
        pupil.parent = root

    return root

# ==============================================================================
# 1. ARCHITECTURE: Cutaway Foundation, Edge-to-Edge Staggered Floor, Acoustic Slats
# ==============================================================================
box('Room foundation', (0, 0, -.17), (5.76, 4.42, .32), edge, .05)
box('Foundation trim', (0, 0, -.02), (5.68, 4.34, .04), dark_walnut, .01)

# Edge-to-edge staggered hardwood planks covering X=[-2.76, 2.66], Y=[-2.12, 2.04]
num_rows = 15
plank_w = 4.16 / num_rows
for row in range(num_rows):
    y = -2.12 + (row + 0.5) * plank_w
    offset = 0.58 if (row % 2 == 1) else 0.0
    cols = [-3.34 + offset + c * 1.18 for c in range(7)]
    for col_idx, cx_start in enumerate(cols):
        x1 = max(-2.76, cx_start)
        x2 = min(2.66, cx_start + 1.172)
        if x2 - x1 > 0.08:
            px = (x1 + x2) * 0.5
            pw = (x2 - x1) - 0.006
            mat_choice = floorwood[(row * 2 + col_idx) % 3]
            plank = box('Oak floor plank', (px, y, .014), (pw, plank_w - 0.006, .048), mat_choice, .004)
            u_off = random.uniform(0.0, 1.0)
            v_off = random.uniform(0.0, 1.0)
            for poly in plank.data.polygons:
                for loop_idx in poly.loop_indices:
                    co = plank.data.vertices[plank.data.loops[loop_idx].vertex_index].co
                    plank.data.uv_layers.active.data[loop_idx].uv = (co.x * 0.65 + u_off, co.y * 0.85 + v_off)

# Back Wall & Right Window Wall
box('Back plaster wall', (0, 2.12, 1.62), (5.68, .15, 3.24), wall, .012)
box('Right wall lower', (2.75, 0, .53), (.15, 4.26, 1.06), wall, .01)
box('Right wall upper', (2.75, 0, 2.98), (.15, 4.26, .48), wall, .01)
box('Right wall front', (2.75, -1.6, 1.9), (.15, 1.06, 1.72), wall, .01)
box('Right wall back', (2.75, 1.84, 1.9), (.15, .58, 1.72), wall, .01)

# Top Capping Timber & Baseboard Skirting
box('Back top timber', (0, 2.09, 3.25), (5.82, .22, .10), walnut, .015)
box('Right top timber', (2.74, 0, 3.25), (.22, 4.38, .10), walnut, .015)
box('Back skirting', (0, 2.02, .11), (5.52, .045, .18), walnut, .008)
box('Right skirting', (2.65, 0, .11), (.045, 4.12, .18), walnut, .008)

# Acoustic Wood Slat Accent Wall Panel (Left side of back wall)
box('Acoustic backing', (-1.85, 2.035, 1.62), (1.58, .02, 2.96), black, .004)
for i in range(20):
    sx = -2.59 + i * 0.078
    box('Acoustic walnut slat', (sx, 2.012, 1.62), (.046, .035, 2.96), walnut, .005)
box('Acoustic frame top', (-1.85, 2.01, 3.11), (1.62, .045, .035), walnut, .006)
box('Acoustic frame right', (-1.05, 2.01, 1.62), (.035, .045, 2.98), walnut, .006)
box('Acoustic top LED', (-1.85, 1.995, 3.085), (1.54, .012, .008), amber, .001)

# Window & Seamless Golden-Hour Landscape Backdrop
sky = textured('Afternoon sky', (.78, .82, .74), 'landscape', rough=.65, emission=.38)
win_ext = box('Window exterior', (2.81, .24, 1.9), (.02, 2.65, 1.62), sky, 0)
for poly in win_ext.data.polygons:
    for loop_idx in poly.loop_indices:
        co = win_ext.data.vertices[win_ext.data.loops[loop_idx].vertex_index].co
        win_ext.data.uv_layers.active.data[loop_idx].uv = ((co.y + 1.325) / 2.65, (co.z + 0.81) / 1.62)
box('Window glass', (2.67, .24, 1.9), (.008, 2.60, 1.58), glass, 0)

for y in [-1.09, 1.57]:
    box('Window timber vertical', (2.66, y, 1.9), (.19, .075, 1.72), walnut, .01)
for z in [1.06, 2.74]:
    box('Window timber horizontal', (2.66, .24, z), (.19, 2.74, .075), walnut, .01)
box('Window mullion', (2.64, .24, 1.9), (.09, .045, 1.65), white, .006)
box('Window crossbar', (2.64, .24, 1.93), (.09, 2.6, .045), white, .006)
box('Window latch', (2.58, .24, 1.93), (.03, .08, .025), brass, .004)
box('Deep window sill', (2.50, .24, 1.03), (.48, 2.92, .085), walnut, .015)

# Top Venetian Blinds (partially lowered for cozy shadow depth)
box('Blind header', (2.56, .24, 2.67), (.08, 2.56, .055), walnut, .008)
for b in range(6):
    bz = 2.60 - b * 0.055
    box('Venetian slat', (2.56, .24, bz), (.045, 2.52, .008), walnut, .002, rot=(0, .35, 0))

# Window Sill Decor: Small Succulent Planter & Warm Glass Lantern
sill_pot_top = pot((2.46, .78, 1.075), .095, .13, terracotta)
for suc_i in range(9):
    sa = suc_i * math.tau / 9
    leafmesh('Succulent rosette', (2.46 + math.cos(sa) * .03, .78 + math.sin(sa) * .03, sill_pot_top), .075, sa - math.pi / 2, -.45, lightleaf if suc_i % 2 == 0 else leaf)
cylinder('Window lantern base', (2.46, -.42, 1.095), .068, .03, black, 24)
cylinder('Window lantern glow', (2.46, -.42, 1.155), .036, .09, amber, 20)
cylinder('Window lantern glass', (2.46, -.42, 1.165), .058, .12, glass, 24)
cylinder('Window lantern cap', (2.46, -.42, 1.235), .064, .02, black, 24)

# Curtain Rod, Finials & Continuous Pleated Linen Curtains
rod('Curtain rail', (2.40, -1.32, 2.89), (2.40, 1.78, 2.89), .022, black)
for y_fin in [-1.34, 1.80]:
    sphere('Curtain finial', (2.40, y_fin, 2.89), (.042, .042, .042), brass)
for y_br in [-1.22, .24, 1.68]:
    rod('Curtain bracket', (2.66, y_br, 2.89), (2.40, y_br, 2.89), .012, black)

for side, base in enumerate([-1.24, 1.28]):
    for j in range(14):
        y = base + j * .032
        wave_x = math.sin(j * 1.45) * .042
        pinch = .028 * math.sin((j - 6.5) * .18) if side == 0 else -.028 * math.sin((j - 6.5) * .18)
        pts = [
            (2.39 + wave_x * .5, y, 2.86),
            (2.37 + wave_x, y + pinch * .5, 2.22),
            (2.39 + wave_x * .8, y + pinch, 1.42),
            (2.36 + wave_x, y + pinch * .6, .68),
        ]
        curve('Linen curtain fold', pts, .038, curtainmat)
        if j % 2 == 0:
            cylinder('Curtain ring', (2.40, y, 2.89), .032, .008, brass, 18, rot=(math.pi / 2, 0, 0))
    # Brass curtain tie-back band
    cylinder('Curtain tieback', (2.38, base + .21, 1.42), .065, .022, brass, 24)

# ==============================================================================
# 2. WORK DESK, DRAWER PEDESTAL & MONITOR RISER SHELF
# ==============================================================================
box('Solid walnut desktop', (-.2, 1.2, 1.16), (4.58, 1.26, .095), walnut, .028)
box('Desktop brass inlay', (-.2, .572, 1.16), (4.52, .008, .018), brass, .002)

# Left Drawer Cabinet (Alex-inspired walnut chest)
box('Drawer cabinet', (-1.95, 1.26, .58), (.68, 1.02, 1.10), walnut, .02)
for idx_d, z in enumerate([.25, .52, .79, 1.01]):
    h_d = .20 if idx_d == 3 else .25
    box('Drawer face', (-1.95, .74, z), (.63, .035, h_d), dark_walnut, .01)
    box('Drawer handle', (-1.95, .712, z + .02), (.18, .022, .014), brass, .004)

# Right Industrial Matte-Black Steel Frame Legs
for y in [.70, 1.72]:
    box('Desk steel upright', (1.88, y, .57), (.06, .06, 1.12), black, .008)
box('Desk steel foot', (1.88, 1.21, .035), (.07, 1.12, .055), black, .008)
box('Desk steel brace', (1.88, 1.21, 1.08), (.07, 1.12, .05), black, .008)
box('Cable management tray', (.35, 1.68, 1.03), (2.4, .16, .10), black, .01)

# Walnut Desk Shelf (Monitor Riser) sitting on Desk
box('Desk riser shelf', (.10, 1.28, 1.285), (1.38, .32, .028), walnut, .008)
for rx in [-.48, .68]:
    box('Riser leg', (rx, 1.28, 1.238), (.025, .26, .068), black, .004)

# ==============================================================================
# 3. ULTRAWIDE MONITOR, SCREENBAR LED & HIGH-RES DONGOS SCREEN TEXTURE
# ==============================================================================
# Heavy-Duty Articulated Gas-Spring Monitor Arm (Ergotron LX style) with Desk Edge C-Clamp
box('Monitor arm clamp upper', (.10, 1.56, 1.222), (.13, .095, .034), black, .006)
box('Monitor arm clamp lower', (.10, 1.56, 1.112), (.11, .085, .018), black, .004)
cylinder('Monitor clamp screw 1', (.06, 1.56, 1.075), .014, .042, silver, 20)
cylinder('Monitor clamp screw 2', (.14, 1.56, 1.075), .014, .042, silver, 20)
cylinder('Monitor arm base collar', (.10, 1.53, 1.258), .046, .056, black, 28)
cylinder('Monitor arm base post', (.10, 1.53, 1.310), .028, .072, silver, 24)

# Lower articulated arm segment with cable management channel
rod('Monitor arm lower', (.10, 1.53, 1.335), (-.06, 1.44, 1.495), .030, black)
cylinder('Monitor arm elbow knuckle', (-.06, 1.44, 1.495), .032, .058, silver, 24)
cylinder('Monitor arm elbow bolt', (-.06, 1.44, 1.528), .014, .012, dark_grey, 20)

# Upper gas-spring forearm segment with sleek silver accent
rod('Monitor arm upper strut', (-.06, 1.44, 1.495), (.10, 1.12, 1.66), .028, silver)
rod('Monitor arm upper cover', (-.04, 1.40, 1.515), (.08, 1.14, 1.66), .018, black)

# Articulated VESA tilt/swivel head & 100x100mm mounting bracket
sphere('VESA swivel ball', (.10, 1.11, 1.66), (.034, .034, .034), silver)
box('VESA mounting plate', (.10, 1.082, 1.66), (.135, .014, .135), black, .004)
for vx in [-.05, .05]:
    for vz in [-.05, .05]:
        cylinder('VESA bolt', (.10 + vx, 1.074, 1.66 + vz), .007, .008, silver, 16, rot=(math.pi / 2, 0, 0))

# Continuous bezel, tapered enclosure and a padded, articulated light-bar clamp.
build_monitor_hardware(silver, screenbar_led)

# Descending video/power cables routed cleanly along monitor arm
curve('Monitor cable bundle', [(.10, 1.04, 1.46), (.10, 1.16, 1.42), (-.04, 1.42, 1.44), (.08, 1.54, 1.26)], .006, black)

# A single front surface matches the HTML projection exactly, without beveled
# corners or rear faces competing with the display housing.
monitor_mesh = bpy.data.meshes.new('Monitor display surface')
monitor_mesh.from_pydata([(-.745, 0, -.33), (.745, 0, -.33),
                          (.745, 0, .33), (-.745, 0, .33)], [], [(0, 1, 2, 3)])
monitor_mesh.uv_layers.new(name='UVMap')
monitor_obj = bpy.data.objects.new('MonitorScreen', monitor_mesh)
bpy.context.collection.objects.link(monitor_obj)
monitor_obj.location = (.1, .979, 1.66)
monitor_obj.data.materials.append(screen)

# Desktop Wireless Rotary Control Puck Dial on Desk Mat
cylinder('ScreenBar dial base', (.60, 1.02, 1.218), .038, .012, dark_grey, 32)
cylinder('ScreenBar dial knurl', (.60, 1.02, 1.226), .036, .010, silver, 32)
cylinder('ScreenBar dial glass', (.60, 1.02, 1.232), .033, .002, display_bezel, 32)
cylinder('ScreenBar dial led', (.60, 1.02, 1.233), .005, .002, cool_led, 16)

# Load Real High-Resolution DongOS Desktop & Terminal UI Textures
mon_img_path = os.path.join(ROOT, 'public/textures/monitor-preview.png')
img = bpy.data.images.load(mon_img_path)
img.pack()

nodes = screen.node_tree.nodes
tex = nodes.new('ShaderNodeTexImage')
tex.image = img
screen.node_tree.links.new(tex.outputs['Color'], nodes.get('Principled BSDF').inputs['Base Color'])
screen.node_tree.links.new(tex.outputs['Color'], nodes.get('Principled BSDF').inputs['Emission Color'])

obj = bpy.data.objects.get('MonitorScreen')
for poly in obj.data.polygons:
    for idx in poly.loop_indices:
        co = obj.data.vertices[obj.data.loops[idx].vertex_index].co
        obj.data.uv_layers.active.data[idx].uv = (co.x / 1.49 + .5, co.z / .66 + .5)

laptop_screen = material('Laptop glass', (.10, .16, .12), .16, emission=.58)
lap_img_path = os.path.join(ROOT, 'public/textures/laptop-preview.png')
if os.path.exists(lap_img_path):
    lap_img = bpy.data.images.load(lap_img_path)
    lap_img.pack()
else:
    lap_img = img
lap_nodes = laptop_screen.node_tree.nodes
lap_tex = lap_nodes.new('ShaderNodeTexImage')
lap_tex.image = lap_img
laptop_screen.node_tree.links.new(lap_tex.outputs['Color'], lap_nodes.get('Principled BSDF').inputs['Base Color'])
laptop_screen.node_tree.links.new(lap_tex.outputs['Color'], lap_nodes.get('Principled BSDF').inputs['Emission Color'])

# ==============================================================================
# 4. PERIPHERALS: Custom Mechanical Keyboard, Mouse, Studio Speakers, Laptop
# ==============================================================================
box('Desk mat', (.18, .86, 1.212), (1.82, .58, .010), deskmat_mat, .025)

box('Keyboard case', (.02, .80, 1.236), (.82, .29, .038), walnut, .012, rot=(.08, 0, 0))
box('Keyboard plate', (.02, .80, 1.252), (.78, .25, .012), black, .004, rot=(.08, 0, 0))
box('Keyboard wrist rest', (.02, .615, 1.224), (.82, .085, .022), walnut, .008, rot=(.05, 0, 0))
box('Wrist rest brass strip', (.02, .656, 1.226), (.80, .005, .020), brass, .001)
for row in range(5):
    for col in range(15):
        if row == 0 and 4 <= col <= 9:
            continue
        if row == 4 and col == 14:
            continue
        kx = -.35 + col * .050
        ky = .70 + row * .044
        kz = 1.268 + row * .0035
        if (row == 4 and col == 0) or (row == 2 and col == 14):
            kmat = key_butter
        elif col == 0 or col >= 13 or row == 0:
            kmat = key_matcha
        else:
            kmat = key_cream
        box('Keyboard key', (kx, ky, kz), (.042, .038, .018), kmat, .004, rot=(.08, 0, 0))
cylinder('Keyboard rotary knob', (.35, .876, 1.286), .020, .022, brass, 24, rot=(.08, 0, 0))
box('Space bar', (.00, .70, 1.268), (.27, .038, .018), key_butter, .005, rot=(.08, 0, 0))
for c_i in range(14):
    cylinder('Keyboard coil', (-.22 + c_i * .014, .98, 1.228), .016, .011, brass if c_i == 13 else white, 16, rot=(0, math.pi / 2, 0))
curve('Keyboard cable lead', [(-.02, .98, 1.228), (.10, 1.12, 1.225), (.10, 1.26, 1.225)], .006, black)

# Desktop Audio DAC / Headphone Amp on Monitor Riser Shelf
box('Audio DAC body', (.50, 1.24, 1.322), (.18, .15, .045), dark_grey, .008)
cylinder('Audio DAC knob', (.50, 1.16, 1.322), .018, .016, brass, 24, rot=(math.pi / 2, 0, 0))
cylinder('Audio DAC glow', (.50, 1.166, 1.322), .021, .004, amber, 24, rot=(math.pi / 2, 0, 0))

# Smooth wireless mouse with a continuous palm dome and separate curved buttons.
build_mouse((.66, .78, 1.218), mouse_body, mouse_wheel_steel, black)

build_speakers(walnut, silver)

# Twelve South Curve Style Seamless Matte-Aluminum Laptop Stand
curve('Laptop stand base curve', [
    (1.18, 1.00, 1.218),
    (1.14, 1.16, 1.218),
    (1.35, 1.26, 1.218),
    (1.52, 1.14, 1.218),
    (1.48, .98, 1.218),
], .012, silver)
curve('Laptop stand arm L', [(1.18, 1.00, 1.218), (1.16, 1.12, 1.26), (1.20, 1.18, 1.325)], .010, silver)
curve('Laptop stand arm R', [(1.48, .98, 1.218), (1.46, 1.10, 1.26), (1.48, 1.16, 1.325)], .010, silver)
box('Laptop stand grip L', (1.20, 1.18, 1.332), (.028, .038, .010), dark_grey, .002, rot=(.24, 0, -.28))
box('Laptop stand grip R', (1.48, 1.16, 1.332), (.028, .038, .010), dark_grey, .002, rot=(.24, 0, -.28))

# Precision MacBook Pro 16" CNC Unibody with Individual Keys & Speaker Grilles
lap_root = bpy.data.objects.new('MacBookRoot', None)
bpy.context.collection.objects.link(lap_root)
lap_root.location = (1.34, 1.12, 1.328)
lap_root.rotation_euler = (0.24, 0, -0.28)

base_c = box('Laptop base chassis', (0, 0, 0), (.58, .38, .016), laptop_chassis, .008)
base_c.parent = lap_root
thumb_sc = box('Laptop thumb scoop', (0, -.188, .004), (.065, .006, .006), dark_grey, .002)
thumb_sc.parent = lap_root

# Recessed matte black keyboard well
well = box('Laptop keyboard well', (0, .036, .010), (.47, .195, .002), laptop_keyboard_well, .001)
well.parent = lap_root

# Row 5: Function row + Touch ID power key
fn_y = .114
for c_i in range(13):
    fn_x = -.215 + c_i * .033
    fn_k = box(f'LapKey_Fn_{c_i}', (fn_x, fn_y, .0095), (.028, .016, .004), laptop_keycap, .001)
    fn_k.parent = lap_root
touch_id = box('LapKey_TouchID', (.218, fn_y, .0095), (.024, .016, .004), black, .001)
touch_id.parent = lap_root

# Row 4: Number row (14 keys)
num_y = .084
for c_i in range(14):
    num_x = -.218 + c_i * .0336
    num_k = box(f'LapKey_Num_{c_i}', (num_x, num_y, .0095), (.029, .020, .004), laptop_keycap, .001)
    num_k.parent = lap_root

# Row 3: QWERTY row (14 keys)
qw_y = .054
for c_i in range(14):
    qw_x = -.218 + c_i * .0336
    qw_k = box(f'LapKey_QW_{c_i}', (qw_x, qw_y, .0095), (.029, .020, .004), laptop_keycap, .001)
    qw_k.parent = lap_root

# Row 2: ASDF row (13 keys + Return key)
as_y = .024
for c_i in range(13):
    as_x = -.218 + c_i * .0336
    as_k = box(f'LapKey_AS_{c_i}', (as_x, as_y, .0095), (.029, .020, .004), laptop_keycap, .001)
    as_k.parent = lap_root
ret_k = box('LapKey_Return', (.215, as_y, .0095), (.030, .020, .004), laptop_keycap, .001)
ret_k.parent = lap_root

# Row 1: ZXCV row (12 keys)
zx_y = -.006
for c_i in range(12):
    zx_x = -.200 + c_i * .0336
    zx_k = box(f'LapKey_ZX_{c_i}', (zx_x, zx_y, .0095), (.029, .020, .004), laptop_keycap, .001)
    zx_k.parent = lap_root

# Row 0: Modifier & Spacebar row
mod_y = -.036
spc_k = box('LapKey_Space', (0, mod_y, .0095), (.175, .020, .004), laptop_keycap, .001)
spc_k.parent = lap_root
for m_x in [-.218, -.185, -.152, -.119, .119, .152]:
    mod_k = box(f'LapKey_Mod_{m_x}', (m_x, mod_y, .0095), (.028, .020, .004), laptop_keycap, .001)
    mod_k.parent = lap_root
arrow_left = box('LapKey_ArrL', (.181, mod_y - .004, .0095), (.016, .010, .004), laptop_keycap, .001)
arrow_left.parent = lap_root
arrow_right = box('LapKey_ArrR', (.221, mod_y - .004, .0095), (.016, .010, .004), laptop_keycap, .001)
arrow_right.parent = lap_root
arrow_up = box('LapKey_ArrU', (.201, mod_y + .008, .0095), (.016, .008, .004), laptop_keycap, .001)
arrow_up.parent = lap_root
arrow_dn = box('LapKey_ArrD', (.201, mod_y - .004, .0095), (.016, .010, .004), laptop_keycap, .001)
arrow_dn.parent = lap_root

# Flanking CNC laser-drilled acoustic stereo speaker grilles
spk_l = box('Laptop speaker grille L', (-.258, .036, .0095), (.028, .190, .001), spk_grille_mat, .0004)
spk_l.parent = lap_root
spk_r = box('Laptop speaker grille R', (.258, .036, .0095), (.028, .190, .001), spk_grille_mat, .0004)
spk_r.parent = lap_root

# Expansive Force Touch etched glass trackpad
track_border = box('Laptop trackpad border', (0, -.111, .0095), (.187, .094, .001), laptop_keyboard_well, .0004)
track_border.parent = lap_root
track_pad = box('Laptop trackpad', (0, -.111, .0107), (.183, .090, .001), laptop_trackpad_mat, .0004)
track_pad.parent = lap_root

# Side chassis ports: MagSafe 3 & dual Thunderbolt 4 on left; HDMI & SD slot on right
p_mag = box('Laptop MagSafe port', (-.291, .11, 0), (.003, .015, .006), dark_grey, .001)
p_mag.parent = lap_root
p_tb1 = box('Laptop TB4 port 1', (-.291, .07, 0), (.003, .011, .004), black, .001)
p_tb1.parent = lap_root
p_tb2 = box('Laptop TB4 port 2', (-.291, .04, 0), (.003, .011, .004), black, .001)
p_tb2.parent = lap_root
p_hdmi = box('Laptop HDMI port', (.291, .08, 0), (.003, .016, .005), black, .001)
p_hdmi.parent = lap_root
p_sd = box('Laptop SD slot', (.291, .03, 0), (.003, .026, .003), black, .001)
p_sd.parent = lap_root

# Cylindrical black aluminum hinge barrel
hinge = cylinder('Laptop hinge barrel', (0, .185, .009), .007, .50, black, 24, rot=(0, math.pi / 2, 0))
hinge.parent = lap_root

# Keep the keycaps entirely above the chassis and keyboard well.
for key in lap_root.children:
    if key.name.startswith('LapKey_'):
        key.location.z = .0135

# A shared hinge pivot keeps every lid layer attached at a 115-degree opening.
# Local -Y faces the user; local +Z runs from the hinge to the top edge.
lid_root = bpy.data.objects.new('LaptopLidRoot', None)
bpy.context.collection.objects.link(lid_root)
lid_root.parent = lap_root
lid_root.location = (0, .185, .009)
lid_root.rotation_euler.x = math.radians(-25)
lid_c = box('Laptop lid chassis', (0, 0, .19), (.58, .012, .38), laptop_chassis, .005)
lid_c.parent = lid_root

# Separate front surfaces along the lid normal to prevent depth fighting.
disp_glass = box('Laptop display glass', (0, -.0085, .19), (.56, .003, .36), display_bezel, .001)
disp_glass.parent = lid_root
cam_notch = box('Laptop camera notch', (0, -.0145, .354), (.036, .003, .012), display_bezel, .001)
cam_notch.parent = lid_root

# One front-facing quad avoids coincident box faces and preserves upright UVs.
lap_mesh = bpy.data.meshes.new('Laptop display surface')
lap_mesh.from_pydata([(-.27, -.012, .02), (.27, -.012, .02),
                      (.27, -.012, .36), (-.27, -.012, .36)], [], [(0, 1, 2, 3)])
lap_mesh.uv_layers.new(name='UVMap')
for loop, uv in zip(lap_mesh.uv_layers.active.data, [(0, 0), (1, 0), (1, 1), (0, 1)]):
    loop.uv = uv
lap_disp = bpy.data.objects.new('LaptopDisplay', lap_mesh)
bpy.context.collection.objects.link(lap_disp)
lap_disp.data.materials.append(laptop_screen)
lap_disp.parent = lid_root

# Studio Headphones on Dedicated Stand + Coffee Mug + Notebook
build_headphones(silver)

cylinder('Cork coaster', (1.76, .78, 1.216), .078, .008, bookmats[2], 28)
cylinder('Coffee mug', (1.76, .78, 1.295), .062, .15, cream_ceramic, 28)
cylinder('Coffee surface', (1.76, .78, 1.362), .054, .008, walnut, 24)
cylinder('Latte art foam', (1.76, .78, 1.365), .028, .004, white, 20)
curve('Mug handle', [(1.815, .78, 1.34), (1.88, .78, 1.34), (1.88, .78, 1.25), (1.815, .78, 1.25)], .011, cream_ceramic)

box('Hardcover journal', (1.02, .74, 1.225), (.24, .32, .026), book_leather_cognac, .005, rot=(0, 0, .18))
box('Journal pages', (1.015, .744, 1.225), (.226, .306, .020), book_pages_mat, .001, rot=(0, 0, .18))
box('Journal strap', (1.08, .74, 1.226), (.018, .325, .028), book_cloth_charcoal, .002, rot=(0, 0, .18))
curve('Journal ribbon bookmark', [(1.02, .88, 1.232), (1.06, .94, 1.220), (1.12, .98, 1.216)], .002, ribbon_gold)
rod('Brass fountain pen', (.96, .66, 1.245), (1.14, .82, 1.245), .007, brass)

# ==============================================================================
# 5. NATURE AQUARIUM (ADA Rimless Crystal Tank, Seiryu Stones, Driftwood, Plants, Fish)
# ==============================================================================
ax, ay = -1.68, 1.26
# High-density closed-cell EVA foam mat under the tank
box('Aquarium mat', (ax, ay, 1.218), (1.06, .64, .016), black, .006)
box('Aquarium base', (ax, ay, 1.245), (1.04, .62, .04), dark_grey, .008)

# Layered Aquasoil Terraces & Meandering La Plata Cosmetic Sand River
box('Aquarium soil base', (ax, ay, 1.292), (.99, .57, .082), gravel, .012)
sphere('Aquasoil mound L', (ax - .26, ay + .09, 1.33), (.28, .21, .078), gravel)
sphere('Aquasoil mound R', (ax + .24, ay + .11, 1.32), (.24, .18, .068), gravel)
sphere('Aquasoil terrace rear', (ax, ay + .18, 1.34), (.38, .12, .072), gravel)

# Natural winding cosmetic sand path flowing between the two stone mounds
box('Aquarium sand path front', (ax - .04, ay - .12, 1.306), (.28, .26, .058), sand_mat, .018, rot=(0, 0, .22))
box('Aquarium sand path mid', (ax - .01, ay + .04, 1.312), (.22, .24, .062), sand_mat, .018, rot=(0, 0, -.15))
box('Aquarium sand path rear', (ax + .05, ay + .16, 1.318), (.18, .20, .065), sand_mat, .016, rot=(0, 0, .32))

# ADA-Style Rimless Low-Iron Optiwhite Glass Panels with Chamfered Corners
for x in [ax - .505, ax + .505]:
    box('Tank side glass', (x, ay, 1.58), (.010, .60, .64), glass, .002)
for y in [ay - .295, ay + .295]:
    box('Tank front back glass', (ax, y, 1.58), (1.02, .010, .64), glass, .002)
for cx_tank in [ax - .505, ax + .505]:
    for cy_tank in [ay - .295, ay + .295]:
        box('Tank corner seam', (cx_tank, cy_tank, 1.58), (.006, .006, .64), dark_grey, .001)

# Water Volume and Surface
box('Water surface', (ax, ay, 1.84), (.99, .58, .008), water, .002)

# ADA Solar / Chihiros Style WRGB Slim Aluminum Fixture
box('Aquarium light bar', (ax, ay, 1.98), (.96, .12, .024), silver, .006)
box('Aquarium LED', (ax, ay, 1.966), (.91, .085, .006), cool_led, .002)
for lx in [ax - .42, ax + .42]:
    rod('Light stand vertical', (lx, ay + .29, 1.56), (lx, ay + .29, 2.02), .008, silver)
    rod('Light stand arm', (lx, ay + .29, 2.02), (lx, ay, 2.02), .008, silver)
    rod('Light suspension wire', (lx, ay, 2.02), (lx, ay, 1.98), .003, silver)

# Glass Lily Pipes & Spiral CO2 Diffuser
curve('Lily pipe inflow', [(ax - .52, ay - .12, 1.48), (ax - .52, ay - .12, 1.91), (ax - .46, ay - .12, 1.91), (ax - .46, ay - .12, 1.56)], .010, glass)
curve('Lily pipe outflow', [(ax - .52, ay + .10, 1.56), (ax - .52, ay + .10, 1.91), (ax - .44, ay + .10, 1.91), (ax - .42, ay + .10, 1.80)], .012, glass)
sphere('Lily pipe suction 1', (ax - .498, ay - .12, 1.72), (.012, .016, .016), glass, 12)
sphere('Lily pipe suction 2', (ax - .498, ay + .10, 1.72), (.012, .016, .016), glass, 12)

# Spiral Glass CO2 Diffuser in right rear corner with porous ceramic disc
curve('CO2 glass hanger', [(ax + .48, ay + .22, 1.62), (ax + .48, ay + .22, 1.88), (ax + .44, ay + .22, 1.88), (ax + .44, ay + .22, 1.42)], .005, glass)
cylinder('CO2 diffuser chamber', (ax + .44, ay + .22, 1.40), .018, .036, glass, 20)
cylinder('CO2 ceramic disc', (ax + .44, ay + .22, 1.412), .015, .006, white, 20)

# Authentic Iwagumi Seiryu Stone Arrangement (Craggy geological facets & quartz veins)
seiryu_crag('Seiryu Oyaishi', (ax - .22, ay + .06, 1.45), (.15, .11, .22), rock_mat, rot=(.22, .14, .45), seed_i=1)
seiryu_crag('Seiryu Fukuishi', (ax - .36, ay + .02, 1.40), (.11, .085, .15), rock_mat, rot=(.18, .12, .38), seed_i=2)
seiryu_crag('Seiryu Soeishi', (ax + .20, ay + .07, 1.41), (.13, .095, .16), rock_mat, rot=(-.15, -.18, -.32), seed_i=3)
seiryu_crag('Seiryu Suteishi 1', (ax - .10, ay - .06, 1.35), (.075, .06, .07), rock_mat, rot=(-.2, .1, 1.1), seed_i=4)
seiryu_crag('Seiryu Suteishi 2', (ax + .32, ay - .05, 1.34), (.065, .05, .055), rock_mat, rot=(0, .25, -.5), seed_i=5)
seiryu_crag('Seiryu Suteishi 3', (ax + .08, ay + .15, 1.36), (.06, .055, .075), rock_mat, rot=(.2, -.1, .8), seed_i=6)

# Natural Gnarled Driftwood (Spiderwood roots clutching Oyaishi stone)
curve('Driftwood trunk', [(ax - .24, ay + .07, 1.34), (ax - .14, ay + .04, 1.48), (ax + .04, ay - .03, 1.62), (ax + .22, ay - .05, 1.73)], .020, driftwood_mat)
curve('Driftwood branch 1', [(ax - .14, ay + .04, 1.48), (ax - .06, ay + .12, 1.60), (ax + .05, ay + .16, 1.70)], .012, driftwood_mat)
curve('Driftwood branch 2', [(ax + .02, ay - .02, 1.56), (ax - .12, ay - .11, 1.65)], .010, driftwood_mat)
curve('Driftwood root 1', [(ax - .22, ay + .05, 1.42), (ax - .32, ay - .04, 1.33)], .008, driftwood_mat)
curve('Driftwood root 2', [(ax + .12, ay - .04, 1.62), (ax + .19, ay + .06, 1.46)], .007, driftwood_mat)

# Weeping Moss Tufts Clinging to Driftwood Forks
for mx, my, mz in [
    (ax - .14, ay + .05, 1.50),
    (ax - .06, ay + .11, 1.61),
    (ax + .03, ay - .01, 1.58),
    (ax + .16, ay - .04, 1.68),
]:
    sphere('Aquarium moss tuft', (mx, my, mz), (.028, .024, .022), moss_mat, 10)

# Foreground Monte Carlo Carpet Cushions on Aquasoil Slopes
carpet_seeds = [
    (ax - .42, ay + .12, 1.31), (ax - .38, ay - .06, 1.31), (ax - .44, ay - .14, 1.30),
    (ax - .30, ay - .18, 1.30), (ax - .28, ay + .18, 1.32), (ax - .18, ay + .22, 1.33),
    (ax + .16, ay + .20, 1.33), (ax + .26, ay + .22, 1.32), (ax + .38, ay + .16, 1.31),
    (ax + .42, ay + .04, 1.31), (ax + .38, ay - .10, 1.30), (ax + .25, ay - .16, 1.30),
    (ax + .16, ay - .18, 1.30),
]
for cx, cy, cz in carpet_seeds:
    for c_sub in range(3):
        ox = cx + random.uniform(-.025, .025)
        oy = cy + random.uniform(-.025, .025)
        sphere('Monte Carlo cushion', (ox, oy, cz), (.026, .026, .014), lightleaf, 8)

# Midground Anubias Nana Petite Around Rock Base
for ax_p, ay_p, az_p, a_rot in [
    (ax - .28, ay + .01, 1.34, .4),
    (ax - .18, ay - .01, 1.35, -.6),
    (ax + .14, ay + .02, 1.35, .8),
    (ax + .24, ay - .01, 1.34, -.3),
]:
    for an_i in range(5):
        an_ang = a_rot + an_i * .65
        leafmesh('Anubias leaf', (ax_p + math.cos(an_ang) * .022, ay_p + math.sin(an_ang) * .022, az_p + an_i * .006), .075, an_ang, .3, darkleaf)

# Background Thicket of Rotala & Ludwigia Stem Plants
for i in range(22):
    px_p = ax - .45 + (i / 21.0) * .90 + random.uniform(-.02, .02)
    py_p = ay + .12 + random.uniform(0, .14)
    ph = random.uniform(.26, .48)
    pmat = redplant if i % 3 == 0 else (lightleaf if i % 2 == 0 else leaf)
    curve('Aquatic stem', [(px_p, py_p, 1.31), (px_p + .015, py_p - .01, 1.31 + ph * .5), (px_p - .01, py_p, 1.31 + ph)], .005, pmat)
    num_tiers = 6
    for j in range(num_tiers):
        leafmesh('Aquatic leaf', (px_p, py_p, 1.32 + j * ph / num_tiers), .09, random.random() * 6.28, .28, pmat)

# Natural Cohesive School of 7 Cardinal Tetras (Slender, Anatomical, Realistic)
# Sized authentically to ~9cm in length, swimming as an aligned school in open water
fish_school = [
    (ax + .08, ay - .14, 1.62, 0.0),    # Leader
    (ax + .04, ay - .11, 1.65, 0.04),   # Upper flank
    (ax + .03, ay - .18, 1.58, -0.04),  # Lower flank
    (ax - .02, ay - .13, 1.63, 0.02),   # Mid core
    (ax - .03, ay - .17, 1.57, -0.02),  # Mid lower
    (ax - .08, ay - .12, 1.61, 0.03),   # Rear upper
    (ax - .10, ay - .16, 1.59, -0.01),  # Rear trailer
]
for i, (fx_init, fy_init, fz_init, f_rot) in enumerate(fish_school):
    root = create_tetra('FishRoot' + str(i), fishmat, fish_fin_mat, fish_iris_mat, black)
    root.location = (fx_init, fy_init, fz_init)
    root.rotation_euler.z = f_rot

# ==============================================================================
# 6. OPEN STEEL, WOOD INTAKE & TEMPERED-GLASS PC WITH VISIBLE HARDWARE
# ==============================================================================
build_pc_tower(case_white, walnut, silver)

# ==============================================================================
# 7. AUTHENTIC FULL MESH ERGONOMIC CHAIR (Herman Miller Aeron Style) & WOVEN RUG
# ==============================================================================
cx, cy = .05, -.42

# 5-Star Polished Aluminum Spider Base & Dual PU Casters
cylinder('Chair base hub', (cx, cy, .17), .062, .07, silver, 28)
for i in range(5):
    a = i * math.tau / 5 + .2
    tip = (cx + math.cos(a) * .42, cy + math.sin(a) * .42, .105)
    rod('Chair base spoke', (cx, cy, .18), tip, .026, silver)
    cylinder('Chair caster wheel', (tip[0], tip[1], .068), .038, .030, black, 20, rot=(0, math.pi / 2, a))
    box('Chair caster hood', (tip[0], tip[1], .092), (.036, .036, .020), silver, .004)

# Pneumatic Class-4 Telescoping Gas Lift
cylinder('Chair gas lift sleeve', (cx, cy, .32), .038, .24, black, 24)
cylinder('Chair gas lift piston', (cx, cy, .46), .028, .20, silver, 24)

# Die-Cast Aluminum Harmonic Tilt Mechanism Chassis & Ergonomic Control Knobs
box('Chair tilt mechanism', (cx, cy - .02, .575), (.28, .28, .085), chair_frame_white, .015)
box('Chair tilt lever L', (cx - .15, cy - .02, .565), (.04, .014, .012), dark_grey, .002)
box('Chair tilt lever R', (cx + .15, cy + .02, .565), (.04, .014, .012), dark_grey, .002)
cylinder('Chair tilt tension knob', (cx + .16, cy - .04, .555), .024, .036, silver, 20, rot=(0, math.pi / 2, 0))

# Transverse Seat Support Bridge Rails
rod('Seat under support 1', (cx - .26, cy, .625), (cx + .26, cy, .625), .012, chair_frame_white)
rod('Seat under support 2', (cx - .24, cy - .14, .625), (cx + .24, cy - .14, .625), .012, chair_frame_white)

# Contoured Full-Mesh Suspension Seat Pan Rim (Zero Cushion Foam!)
seat_rim_pts = [
    (cx - .30, cy - .22, .675),
    (cx - .32, cy + .02, .680),
    (cx - .28, cy + .26, .645),
    (cx, cy + .30, .635),
    (cx + .28, cy + .26, .645),
    (cx + .32, cy + .02, .680),
    (cx + .30, cy - .22, .675),
    (cx, cy - .24, .670),
    (cx - .30, cy - .22, .675),
]
seat_rim = curve('Chair seat rim', seat_rim_pts, .024, chair_frame_white)

# Suspended Breathable Pellicle Mesh Membrane (Navy Blue)
suspension_mesh('Chair seat mesh membrane', seat_rim, pellicle_navy, axis='seat', sag=.018)

# Twin Wishbone Structural Spine Rising from Tilt Mechanism
curve('Chair spine L', [(cx - .08, cy - .16, .58), (cx - .12, cy - .28, .84), (cx - .08, cy - .32, 1.14)], .022, chair_frame_white)
curve('Chair spine R', [(cx + .08, cy - .16, .58), (cx + .12, cy - .28, .84), (cx + .08, cy - .32, 1.14)], .022, chair_frame_white)
curve('Chair spine central', [(cx, cy - .18, .58), (cx, cy - .30, .92), (cx, cy - .33, 1.32), (cx, cy - .31, 1.50)], .028, chair_frame_white)

# Anatomical Hourglass Full-Mesh Backrest Perimeter Frame
back_rim_pts = [
    (cx - .26, cy - .24, .72),
    (cx - .31, cy - .30, 1.05),
    (cx - .27, cy - .31, 1.46),
    (cx, cy - .31, 1.48),
    (cx + .27, cy - .31, 1.46),
    (cx + .31, cy - .30, 1.05),
    (cx + .26, cy - .24, .72),
    (cx, cy - .23, .71),
    (cx - .26, cy - .24, .72),
]
back_rim = curve('Chair back frame', back_rim_pts, .024, chair_frame_white)

# Suspended Breathable Pellicle Mesh Membrane (Smoke Silver Mesh)
suspension_mesh('Chair back mesh membrane', back_rim, pellicle_smoke, sag=.025)

# PostureFit SL Dual Articulating Lumbar & Sacral Support with Fine-Tuning Dials
box('PostureFit sacral pad', (cx, cy - .312, .86), (.28, .036, .09), dark_grey, .012)
box('PostureFit lumbar pad', (cx, cy - .322, 1.01), (.34, .038, .12), dark_grey, .014)
cylinder('PostureFit dial L', (cx - .18, cy - .322, 1.01), .016, .022, silver, 20, rot=(0, math.pi / 2, 0))
cylinder('PostureFit dial R', (cx + .18, cy - .322, 1.01), .016, .022, silver, 20, rot=(0, math.pi / 2, 0))

# Articulated Double-Pivot Aluminum Headrest with Suspended Mesh Membrane
rod('Headrest lower stem', (cx, cy - .31, 1.48), (cx, cy - .32, 1.60), .022, silver)
cylinder('Headrest pivot joint', (cx, cy - .32, 1.60), .022, .06, silver, 24, rot=(0, math.pi / 2, 0))
rod('Headrest upper stem', (cx, cy - .32, 1.60), (cx, cy - .29, 1.68), .020, silver)
headrest_rim_pts = [
    (cx - .18, cy - .28, 1.64),
    (cx - .19, cy - .29, 1.74),
    (cx, cy - .295, 1.75),
    (cx + .19, cy - .29, 1.74),
    (cx + .18, cy - .28, 1.64),
    (cx, cy - .275, 1.63),
    (cx - .18, cy - .28, 1.64),
]
headrest_rim = curve('Headrest frame', headrest_rim_pts, .016, chair_frame_white)
suspension_mesh('Headrest mesh membrane', headrest_rim, pellicle_navy, sag=.008)

# 3D Adjustable Armrests: Polished Aluminum Risers & Inward-Angled Soft PU Pads
for side_x, sign in [(cx - .35, -1), (cx + .35, 1)]:
    curve(f'Armrest riser {sign}', [(cx + sign * .15, cy - .04, .59), (side_x, cy - .02, .76), (side_x, cy + .02, .92)], .022, silver)
    cylinder(f'Armrest height collar {sign}', (side_x, cy + .02, .92), .026, .032, dark_grey, 20)
    box(f'Armrest trigger {sign}', (side_x, cy + .02, .91), (.024, .016, .012), dark_grey, .002)
    box(f'Armrest pad {sign}', (side_x + sign * .015, cy + .06, .955), (.115, .29, .036), armrest_grey, .015, rot=(0, 0, -sign * .09))

box('Rug underpad', (.05, -.52, .038), (2.36, 1.98, .010), dark_walnut, .005)
rug_obj = box('Woven area rug', (.05, -.52, .046), (2.28, 1.92, .022), rug, .01)
for poly in rug_obj.data.polygons:
    for loop_idx in poly.loop_indices:
        co = rug_obj.data.vertices[rug_obj.data.loops[loop_idx].vertex_index].co
        rug_obj.data.uv_layers.active.data[loop_idx].uv = (co.x / 2.28 + 0.5, co.y / 1.92 + 0.5)
for x_fr in [-1.09, 1.19]:
    for j in range(42):
        fy_fr = -1.42 + j * .043
        rod('Rug fringe', (x_fr, fy_fr, .048), (x_fr + (-.065 if x_fr < 0 else .065), fy_fr, .048), .0035, curtainmat)

# ==============================================================================
# 8. FLOATING SHELVES, BOOKS, VINTAGE CAMERA, WALL ART, CLOCK & PLANTS
# ==============================================================================
for z, length, x in [(2.46, 3.55, -.42), (2.92, 1.55, -1.25)]:
    box('Floating walnut shelf', (x, 1.88, z), (length, .42, .065), walnut, .014)
    box('Shelf warm light', (x, 1.76, z - .034), (length - .14, .022, .008), amber, .002)


def create_hardcover_book(name, pos, size, cover_mat, pages_mat, title_mat, rot_y=0.0, ribbon_mat=None):
    bw, bd, bh = size
    x, y, z = pos
    root = bpy.data.objects.new(name + 'Root', None)
    bpy.context.collection.objects.link(root)
    root.location = (x, y, z)
    root.rotation_euler.y = rot_y

    c_obj = box(name + ' cover', (0, 0, 0), (bw, bd, bh), cover_mat, .004)
    c_obj.parent = root

    pw = max(0.006, bw - 0.007)
    pd = max(0.012, bd - 0.010)
    ph = max(0.015, bh - 0.012)
    p_obj = box(name + ' pages', (0, 0.005, 0), (pw, pd, ph), pages_mat, .001)
    p_obj.parent = root

    t_obj = box(name + ' title', (0, -bd / 2 - 0.001, bh * 0.12), (bw * 0.72, 0.002, bh * 0.35), title_mat, .001)
    t_obj.parent = root

    for r_i in range(3):
        rz = -bh / 2 + (r_i + 1) * (bh / 4)
        rib = box(name + ' rib ' + str(r_i), (0, -bd / 2 - 0.001, rz), (bw * 0.90, 0.0025, 0.004), cover_mat, .001)
        rib.parent = root

    if ribbon_mat:
        curve(name + ' ribbon', [(0, -bd * 0.15, bh / 2 + 0.004), (0.006, -bd * 0.42, bh / 2 - 0.04), (0.008, -bd * 0.45, -bh * 0.25)], .002, ribbon_mat)
    return root

# Curated library on main shelf with varied dimensions, raised ribs & foil titles
book_configs = [
    (0.065, 0.25, 0.36, book_cloth_charcoal, foil_gold, 0.0, None, 0.0),
    (0.052, 0.23, 0.33, book_cloth_navy, foil_silver, 0.0, ribbon_gold, 0.0),
    (0.038, 0.21, 0.29, book_leather_cognac, foil_gold, 0.0, None, -0.016),
    (0.046, 0.24, 0.34, book_cloth_olive, foil_blind, 0.0, None, 0.0),
    (0.032, 0.20, 0.26, book_paper_sand, foil_blind, 0.0, None, 0.0),
    (0.058, 0.24, 0.32, book_cloth_terracotta, foil_gold, 0.0, ribbon_burgundy, 0.0),
    (0.042, 0.22, 0.28, book_ochre, foil_blind, 0.0, None, 0.0),
    (0.035, 0.21, 0.31, book_cloth_navy, foil_gold, 0.0, None, 0.0),
    (0.048, 0.23, 0.35, book_cloth_olive, foil_silver, 0.0, None, 0.0),
    (0.028, 0.19, 0.24, book_paper_sand, foil_blind, 0.0, None, 0.0),
    (0.045, 0.22, 0.30, book_leather_cognac, foil_gold, 0.06, None, 0.0),
    (0.042, 0.23, 0.32, book_cloth_charcoal, foil_silver, 0.13, None, 0.0),
    (0.048, 0.24, 0.33, book_cloth_terracotta, foil_gold, 0.21, None, 0.0),
]
bx = -1.82
for i, (bw, bd, bh, cmat, tmat, ry, rib, oy) in enumerate(book_configs):
    create_hardcover_book(f'ShelfBook{i}', (bx + bw / 2, 1.88 + oy, 2.495 + bh / 2), (bw, bd, bh), cmat, book_pages_mat, tmat, rot_y=ry, ribbon_mat=rib)
    bx += bw + (0.012 if ry > 0 else 0.005)

# Heavy sculptural modernist brass bookend
box('Brass bookend base', (bx + .02, 1.88, 2.503), (.08, .21, .016), brass, .003)
box('Brass bookend upright', (bx + .055, 1.88, 2.60), (.018, .21, .21), brass, .004)

# 3 Horizontal Art Monographs Stacked on Upper Shelf
stack_y = 1.88
for s_i, (sw, sd, sh, smat, stmat, srot) in enumerate([
    (0.35, 0.25, 0.055, book_cloth_charcoal, foil_gold, 0.0),
    (0.32, 0.24, 0.048, book_cloth_olive, foil_silver, 0.04),
    (0.29, 0.22, 0.042, book_cloth_terracotta, foil_gold, -0.02),
]):
    sz_cur = 2.955 + s_i * 0.050
    root_s = bpy.data.objects.new(f'StackedBook{s_i}Root', None)
    bpy.context.collection.objects.link(root_s)
    root_s.location = (-1.55, stack_y, sz_cur + sh / 2)
    root_s.rotation_euler.z = srot

    c_s = box(f'StackedBook{s_i} cover', (0, 0, 0), (sw, sd, sh), smat, .003)
    c_s.parent = root_s
    p_s = box(f'StackedBook{s_i} pages', (0.004, 0.004, 0), (sw - 0.010, sd - 0.010, sh - 0.009), book_pages_mat, .001)
    p_s.parent = root_s
    t_s = box(f'StackedBook{s_i} title', (-sw / 2 - 0.001, 0, 0), (0.002, sd * 0.70, sh * 0.65), stmat, .001)
    t_s.parent = root_s

cylinder('Shelf ceramic vase', (-.82, 1.88, 3.06), .068, .22, cream_ceramic, 24)
for d_i in range(4):
    curve('Dried botanical stem', [(-.82, 1.88, 3.15), (-.82 + (d_i - 1.5) * .04, 1.84, 3.32)], .004, book_paper_sand)

# Vintage Classic Rangefinder Camera (Leica M Inspired Masterpiece)
cx, cy, cz = -0.06, 1.83, 2.495
cam_root = bpy.data.objects.new('CameraRoot', None)
bpy.context.collection.objects.link(cam_root)

w_cam, d_cam, h_cam = 0.23, 0.076, 0.125
r_cam = d_cam / 2.0
w_mid_cam = w_cam - 2 * r_cam
h_mid_cam = h_cam * 0.68

# Body chassis with tactile vulcanite pebble grip and rounded ends
b_mid = box('Camera body mid', (cx, cy, cz + 0.012 + h_mid_cam / 2), (w_mid_cam, d_cam, h_mid_cam), cam_leather, .003)
b_mid.parent = cam_root
for side in [-1, 1]:
    cyl = cylinder('Camera body end', (cx + side * w_mid_cam / 2, cy, cz + 0.012 + h_mid_cam / 2), r_cam, h_mid_cam, cam_leather, 24)
    cyl.parent = cam_root

# Machined satin chrome baseplate & top plate
b_base = box('Camera baseplate', (cx, cy, cz + 0.006), (w_cam, d_cam, 0.012), cam_chrome, .002)
b_base.parent = cam_root
b_top = box('Camera top plate', (cx, cy, cz + 0.012 + h_mid_cam + 0.018), (w_cam, d_cam, 0.036), cam_chrome, .004)
b_top.parent = cam_root

# Iconic red dot enamel badge
red_dot = cylinder('Camera red dot', (cx + 0.065, cy - d_cam / 2 - 0.0015, cz + 0.096), 0.009, 0.003, red_enamel, 20, rot=(math.pi / 2, 0, 0))
red_dot.parent = cam_root

# Optical rangefinder & frameline windows
vf_win = box('Camera viewfinder window', (cx + 0.028, cy - d_cam / 2 - 0.001, cz + 0.100), (0.028, 0.004, 0.018), cam_lens_glass, .002)
vf_win.parent = cam_root
frame_win = box('Camera frameline window', (cx - 0.014, cy - d_cam / 2 - 0.001, cz + 0.100), (0.022, 0.004, 0.016), cam_lens_glass, .002)
frame_win.parent = cam_root
rf_port = cylinder('Camera rangefinder port', (cx - 0.055, cy - d_cam / 2 - 0.001, cz + 0.100), 0.008, 0.004, cam_lens_glass, 18, rot=(math.pi / 2, 0, 0))
rf_port.parent = cam_root

# Mechanical controls
shutter_dial = cylinder('Camera shutter dial', (cx - 0.018, cy + 0.005, cz + 0.138), 0.017, 0.016, cam_chrome, 24)
shutter_dial.parent = cam_root
shutter_btn = cylinder('Camera shutter button', (cx + 0.058, cy - 0.006, cz + 0.136), 0.011, 0.014, brass, 20)
shutter_btn.parent = cam_root
lever = box('Camera advance lever', (cx + 0.082, cy + 0.015, cz + 0.134), (0.014, 0.042, 0.006), cam_chrome, .002)
lever.parent = cam_root
rewind_dial = cylinder('Camera rewind dial', (cx - 0.085, cy, cz + 0.136), 0.018, 0.014, cam_chrome, 24)
rewind_dial.parent = cam_root
hot_shoe = box('Camera hot shoe', (cx + 0.020, cy, cz + 0.134), (0.024, 0.026, 0.007), cam_chrome, .002)
hot_shoe.parent = cam_root

# Fast 50mm f/1.4 prime lens with multi-coated optics
lens_y = cy - d_cam / 2
l_mount = cylinder('Lens bayonet mount', (cx + 0.012, lens_y - 0.007, cz + 0.055), 0.052, 0.014, cam_chrome, 32, rot=(math.pi / 2, 0, 0))
l_mount.parent = cam_root
l_barrel = cylinder('Lens barrel', (cx + 0.012, lens_y - 0.032, cz + 0.055), 0.047, 0.038, black, 32, rot=(math.pi / 2, 0, 0))
l_barrel.parent = cam_root
l_aperture = cylinder('Lens aperture ring', (cx + 0.012, lens_y - 0.055, cz + 0.055), 0.048, 0.012, dark_grey, 32, rot=(math.pi / 2, 0, 0))
l_aperture.parent = cam_root
l_filter = cylinder('Lens filter ring', (cx + 0.012, lens_y - 0.068, cz + 0.055), 0.045, 0.014, black, 32, rot=(math.pi / 2, 0, 0))
l_filter.parent = cam_root
l_glass = cylinder('Lens optical glass', (cx + 0.012, lens_y - 0.065, cz + 0.055), 0.038, 0.006, cam_lens_glass, 28, rot=(math.pi / 2, 0, 0))
l_glass.parent = cam_root
l_tab = box('Lens focus tab', (cx + 0.012, lens_y - 0.035, cz + 0.010), (0.014, 0.012, 0.016), black, .002)
l_tab.parent = cam_root

# Supple leather strap draped gracefully on shelf
for s_dir, s_x in [(-1, cx - 0.12), (1, cx + 0.12)]:
    cylinder('Camera strap lug', (s_x, cy, cz + 0.075), 0.004, 0.008, cam_chrome, 12, rot=(0, math.pi / 2, 0))
curve('Camera leather strap L', [(cx - 0.12, cy, cz + 0.075), (cx - 0.14, cy - 0.03, cz + 0.03), (cx - 0.12, cy - 0.08, cz + 0.008), (cx - 0.04, cy - 0.09, cz + 0.006)], .004, leather_strap_mat)
curve('Camera leather strap R', [(cx + 0.12, cy, cz + 0.075), (cx + 0.14, cy - 0.03, cz + 0.03), (cx + 0.11, cy - 0.07, cz + 0.008)], .004, leather_strap_mat)

# Portable Designer Mushroom Lamp (Flos Bellhop / Hay PC Inspired)
lx, ly, lz = 0.82, 1.86, 2.495
lamp_root = bpy.data.objects.new('MushroomLampRoot', None)
bpy.context.collection.objects.link(lamp_root)
lamp_root.location = (lx, ly, lz)

b_base = cylinder('Mushroom lamp base', (0, 0, 0.016), 0.065, 0.032, lamp_sage, 32)
b_base.parent = lamp_root
b_foot = cylinder('Mushroom lamp foot', (0, 0, 0.002), 0.063, 0.004, black, 28)
b_foot.parent = lamp_root
b_btn = cylinder('Mushroom dimmer button', (0, -0.052, 0.024), 0.008, 0.006, brass, 20, rot=(0.35, 0, 0))
b_btn.parent = lamp_root

stem = cylinder('Mushroom lamp stem', (0, 0, 0.0945), 0.026, 0.125, lamp_sage, 32)
stem.parent = lamp_root
col = cylinder('Mushroom brass collar', (0, 0, 0.158), 0.029, 0.008, brass, 32)
col.parent = lamp_root

bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=18, radius=0.112, location=(0, 0, 0.222))
dome = finish(bpy.context.object, 'Mushroom shade dome', lamp_sage)
dome.scale = (1, 1, 0.65)
bpy.ops.object.transform_apply(scale=True)
dome.parent = lamp_root

skirt = cylinder('Mushroom shade skirt', (0, 0, 0.198), 0.112, 0.022, lamp_sage, 32)
skirt.parent = lamp_root

glow = cylinder('Mushroom lamp glow', (0, 0, 0.190), 0.100, 0.008, amber, 32)
glow.parent = lamp_root

# Framed Gallery Art (Deep Solid Walnut Shadowbox, Brass Fillet, Archival Matboard & Museum Glass)
art_mat = textured('Gallery print', (.91, .88, .82), 'artprint', rough=.78)
box('Picture frame', (-2.12, 1.98, 2.08), (.74, .048, .88), walnut, .014)
box('Picture brass fillet', (-2.12, 1.968, 2.08), (.67, .022, .81), brass, .003)
box('Picture matboard', (-2.12, 1.956, 2.08), (.65, .012, .79), white, .002)
art_canvas = box('Picture canvas', (-2.12, 1.948, 2.08), (.52, .006, .66), art_mat, 0)
for poly in art_canvas.data.polygons:
    for loop_idx in poly.loop_indices:
        co = art_canvas.data.vertices[art_canvas.data.loops[loop_idx].vertex_index].co
        art_canvas.data.uv_layers.active.data[loop_idx].uv = (co.x / .52 + 0.5, co.z / .66 + 0.5)
box('Picture glass', (-2.12, 1.940, 2.08), (.655, .004, .795), picture_glass_mat, .002)

# Leaning mini-frame art postcard on upper shelf
mini_frame = box('Mini picture frame', (-1.18, 1.88, 3.06), (.18, .024, .22), walnut, .004, rot=(.14, 0, -.06))
mini_canvas = box('Mini picture canvas', (-1.18, 1.868, 3.06), (.14, .004, .18), art_mat, .001, rot=(.14, 0, -.06))
for poly in mini_canvas.data.polygons:
    for loop_idx in poly.loop_indices:
        co = mini_canvas.data.vertices[mini_canvas.data.loops[loop_idx].vertex_index].co
        mini_canvas.data.uv_layers.active.data[loop_idx].uv = (co.x / .14 + 0.5, co.z / .18 + 0.5)

cylinder('Clock case', (1.72, 2.005, 2.65), .24, .05, walnut, 48, rot=(math.pi / 2, 0, 0))
cylinder('Clock face', (1.72, 1.975, 2.65), .215, .012, white, 48, rot=(math.pi / 2, 0, 0))
for h_i in range(12):
    ha = h_i * math.tau / 12
    hx = 1.72 + math.sin(ha) * .175
    hz = 2.65 + math.cos(ha) * .175
    sphere('Clock marker', (hx, 1.965, hz), (.008, .004, .008), brass, 8)
rod('Clock minute', (1.72, 1.96, 2.65), (1.72, 1.96, 2.81), .008, black)
rod('Clock hour', (1.72, 1.958, 2.65), (1.60, 1.958, 2.71), .011, brass)
sphere('Clock center cap', (1.72, 1.955, 2.65), (.016, .008, .016), brass, 12)

# Lush Spreading Floor Planter on Wooden Stand by Window
stand_z = .12
for leg_a in range(4):
    la = leg_a * math.tau / 4 + math.pi / 4
    lx = 2.08 + math.cos(la) * .20
    ly = -1.22 + math.sin(la) * .20
    rod('Plant stand leg', (lx, ly, .03), (lx, ly, .34), .018, walnut)
    rod('Plant stand crossbar', (2.08, -1.22, .15), (lx, ly, .15), .014, walnut)
top = pot((2.08, -1.22, stand_z), .26, .38, cream_ceramic)
for i in range(14):
    a = i * 2.399
    h = .38 + (i % 4) * .16
    r_spread = .22 + (1.0 - (i / 18.0)) * .22
    x = 2.08 + math.cos(a) * r_spread
    y = -1.22 + math.sin(a) * r_spread
    curve('Floor plant stem', [
        (2.08, -1.22, top - .02),
        (2.08 + math.cos(a) * r_spread * .45, -1.22 + math.sin(a) * r_spread * .45, top + h * .65),
        (x, y, top + h),
    ], .012, darkleaf)
    # Orient leaf outward from center of pot (angle = a - pi/2 makes +Y of leaf point along (cos a, sin a))
    leafmesh('Floor plant leaf', (x, y, top + h), .38, a - math.pi / 2, -.35, lightleaf if i % 3 == 0 else (darkleaf if i % 2 == 0 else leaf))

# Articulated metal desk lamp with a hollow shade, pivots and tension spring.
build_desk_lamp(silver)

# ==============================================================================
# 9. APPLY MODIFIERS, MERGE BY MATERIAL & EXPORT GLB + CYCLES PREVIEW
# ==============================================================================
bpy.ops.object.select_all(action='DESELECT')
for obj in list(bpy.context.scene.objects):
    if obj.type in {'MESH', 'CURVE'}:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.convert(target='MESH')
        obj.select_set(False)

groups = {}
for obj in list(bpy.context.scene.objects):
    if obj.type == 'MESH' and obj.parent is None and not obj.name.endswith('mesh membrane') and len(obj.data.materials) > 0 and obj.data.materials[0] is not None:
        groups.setdefault(obj.data.materials[0].name, []).append(obj)

for name, objects in groups.items():
    valid = [o for o in objects if o.name in bpy.data.objects and o.type == 'MESH' and len(o.data.vertices) > 0]
    if not valid:
        continue
    if len(valid) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for obj in valid:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = valid[0]
        bpy.ops.object.join()
    valid[0].name = 'Room_' + name.replace(' ', '_')

bpy.ops.object.select_all(action='DESELECT')

# Export GLB for Three.js WebGL Runtime
bpy.ops.export_scene.gltf(
    filepath=os.path.join(ROOT, 'public/models/room.glb'),
    export_format='GLB',
    export_yup=True,
    export_cameras=False,
    export_lights=False,
)

# Render High-Quality Cycles Fallback Preview Image
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
world = scene.world or bpy.data.worlds.new('Studio world')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.88, .92, .90, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .85

def area(name, pos, power, color, size, target):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = power
    data.color = color
    data.shape = 'DISK'
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()

area('Warm afternoon key', (1, -2.5, 6.2), 720, (1, .82, .58), 4.2, (0, 0, .8))
area('Window daylight', (4.2, -.1, 3.1), 540, (.88, .93, 1), 3.2, (0, 0, 1))
area('Soft front fill', (-4.2, -4.2, 4.2), 420, (.84, .89, 1), 5.2, (0, 0, 1))

def point(name, pos, power, color, radius):
    data = bpy.data.lights.new(name, 'POINT')
    data.energy = power
    data.color = color
    data.shadow_soft_size = radius
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = pos

point('Mushroom lamp warm glow', (0.82, 1.86, 2.66), 24, (1.0, .84, .56), .04)

bpy.ops.object.camera_add(location=(-7.8, -8.6, 6.1))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 1.15)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 8.7
scene.camera = camera
scene.render.resolution_x = 1400
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = True
scene.render.filepath = os.path.join(ROOT, 'public/images/room-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'blender/room.blend'))
bpy.ops.render.render(write_still=True)
print('DONGOS_ASSETS_COMPLETE', os.path.getsize(os.path.join(ROOT, 'public/models/room.glb')))
