"""Render the text-free loading diorama independently of the main room model."""
import bpy, math, os, tempfile
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(tempfile.gettempdir(), 'profile-loading-render')
os.makedirs(OUT, exist_ok=True)
def mat(name, color, rough=.65, metal=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    s=m.node_tree.nodes.get('Principled BSDF');s.inputs['Base Color'].default_value=(*color,1);s.inputs['Roughness'].default_value=rough;s.inputs['Metallic'].default_value=metal
    return m
def cube(name, pos, size, material, radius=.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos);o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
    if radius:
        b=o.modifiers.new('Soft corners','BEVEL');b.width=radius;b.segments=4
        o.modifiers.new('Soft normals','WEIGHTED_NORMAL')
    return o
def cyl(name, pos, radius, depth, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=radius,depth=depth,location=pos);o=bpy.context.object;o.name=name;o.data.materials.append(material)
    b=o.modifiers.new('Rounded edge','BEVEL');b.width=.025;b.segments=3
    for p in o.data.polygons:p.use_smooth=True
    return o
def rod(a,b,r,material):
    a,b=Vector(a),Vector(b);o=cyl('Support',(a+b)/2,r,(a-b).length,material);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o
sand=mat('Warm limestone',(.64,.57,.47));wall=mat('Muted blue plaster',(.24,.32,.36));edge=mat('Floor trim',(.18,.24,.28));wood=mat('Honey ash',(.58,.42,.26));cream=mat('Porcelain',(.76,.72,.62));metal=mat('Satin metal',(.32,.40,.42),.35,.5);dark=mat('Graphite',(.035,.065,.075));sage=mat('Sage upholstery',(.26,.38,.34));leaf=mat('Plant green',(.18,.32,.22));soil=mat('Soil',(.065,.055,.04));water=mat('Aquarium water',(.10,.25,.25),.3);gold=mat('Fish',(.83,.52,.20));rug=mat('Woven slate',(.16,.23,.28))
cube('Floating plinth',(0,0,0),(3.7,3.0,.20),edge,.10)
cube('Floor',(0,0,.12),(3.65,2.95,.10),sand,.07)
cube('Back wall',(0,1.42,1.2),(3.68,.12,2.25),wall,.07)
cube('Side wall',(1.77,.1,1.2),(.12,2.68,2.25),wall,.06)
# Recessed night window with warm frame.
window=mat('Window night',(.025,.055,.09),.35)
cube('Window frame',(1.68,.45,1.58),(.08,1.3,1.12),cream,.03)
cube('Window glass',(1.625,.45,1.58),(.02,1.17,.99),window,.01)
cube('Window mullion',(1.60,.45,1.58),(.035,.04,1.0),cream,.01)
cube('Window transom',(1.60,.45,1.58),(.035,1.17,.04),cream,.01)
# A small shelf and book grouping.
cube('Floating shelf',(-.65,1.28,1.84),(1.54,.34,.07),wood,.025)
for i in range(5):
    book=cube('Book',(-1.1+i*.12,1.27,1.99),(.08,.20,.24+(i%3)*.03),[cream,sage,edge][i%3],.012)
# Rounded desk and cabinet.
cube('Desktop',(-.05,.60,1.02),(2.95,1.04,.12),wood,.065)
cube('Cabinet',(-1.12,.62,.59),(.53,.85,.78),cream,.045)
for z in [.39,.63,.87]:cube('Drawer pull',(-1.12,.177,z),(.18,.025,.025),metal,.012)
cube('Desk leg',(1.20,.62,.58),(.08,.82,.82),metal,.022)
cube('Desk mat',(.25,.47,1.09),(1.56,.65,.018),rug,.03)
# Monitor, stand, keyboard and mouse.
cube('Monitor stand',(.25,.75,1.13),(.40,.25,.035),metal,.025)
cube('Monitor stem',(.25,.83,1.33),(.06,.06,.37),metal,.022)
cube('Monitor bezel',(.25,.83,1.60),(1.14,.09,.69),dark,.045)
screen=mat('Screen glow',(.18,.31,.28),.5)
ss=screen.node_tree.nodes.get('Principled BSDF');ss.inputs['Emission Color'].default_value=(.20,.38,.31,1)
cube('Screen',(.25,.775,1.60),(1.04,.012,.58),screen,.025)
# Pale abstract interface bars without lettering.
for x,w,z in [(-.12,.16,1.76),(.10,.35,1.76),(.12,.64,1.61),(.02,.44,1.50)]:cube('Screen detail',(x,.763,z),(w,.008,.018),sage,.006)
cube('Keyboard',(.16,.26,1.12),(.65,.23,.045),cream,.024)
for row in range(3):
    for col in range(9):cube('Key',(-.11+col*.065,.19+row*.065,1.151),(.047,.045,.015),sand,.008)
mouse=cube('Mouse',(.72,.29,1.13),(.13,.22,.07),dark,.045)
# Aquarium with softened glass enclosure, substrate and aquatic leaves.
cube('Aquarium base',(-1.08,.68,1.13),(.61,.50,.07),dark,.025)
glass=mat('Tinted aquarium glass',(.26,.57,.51),.18)
gs=glass.node_tree.nodes.get('Principled BSDF');gs.inputs['Transmission Weight'].default_value=.75;gs.inputs['IOR'].default_value=1.15
cube('Aquarium',(-1.08,.68,1.39),(.58,.47,.47),glass,.035)
cube('Substrate',(-1.08,.68,1.19),(.52,.40,.06),sand,.018)
for x,y,h in [(-1.25,.70,.29),(-.99,.78,.34),(-1.13,.56,.23)]:
    rod((x,y,1.22),(x+.025,y,1.22+h),.015,leaf)
    for side in [-1,1]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=(x+side*.045,y,1.30+h*.40));o=bpy.context.object;o.scale=(.065,.016,.11);o.rotation_euler[1]=side*.45;o.data.materials.append(leaf)
# Desk lamp, with light animated on first.
cyl('Lamp base',(-.59,.55,1.12),.12,.035,metal)
rod((-.59,.55,1.13),(-.59,.55,1.43),.025,metal)
rod((-.59,.55,1.43),(-.73,.55,1.65),.025,metal)
bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=.16,radius2=.08,depth=.15,location=(-.73,.55,1.65));o=bpy.context.object;o.data.materials.append(sage);o.rotation_euler[1]=-.25
bpy.ops.object.light_add(type='POINT',location=(-.74,.50,1.52));lamp=bpy.context.object;lamp.data.color=(1,.68,.34);lamp.data.shadow_soft_size=.16
for f,e in [(1,0),(10,0),(17,25),(51,25),(60,0)]:lamp.data.energy=e;lamp.data.keyframe_insert('energy',frame=f)
# Potted plant at the room corner.
cyl('Planter',(1.28,-.90,.42),.23,.50,cream);cyl('Planter soil',(1.28,-.90,.68),.20,.02,soil)
for i in range(6):
    a=i*math.tau/6;x=1.28+math.sin(a)*.21;y=-.9+math.cos(a)*.21;h=.98+(i%2)*.25
    rod((1.28,-.9,.68),(x,y,h),.012,leaf)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=(x,y,h));o=bpy.context.object;o.scale=(.12,.055,.23);o.rotation_euler=(.4*math.cos(a),.5*math.sin(a),a);o.data.materials.append(leaf)
# Chair with a rounded upholstered shell.
cube('Rug',(.0,-.69,.19),(1.6,1.18,.025),rug,.09)
chair=bpy.data.objects.new('Animated chair',None);bpy.context.collection.objects.link(chair);chair.location=(.15,-.59,.19)
parts=[]
parts.append(cyl('Chair lift',(0,0,.30),.035,.50,metal))
for i in range(5):
    a=i*math.tau/5;parts.append(rod((0,0,.10),(.32*math.cos(a),.32*math.sin(a),.06),.025,metal))
parts.append(cube('Chair seat',(0,0,.58),(.59,.56,.14),sage,.10))
parts.append(cube('Chair back',(0,-.22,.91),(.57,.13,.58),sage,.10))
for x in [-.32,.32]:
    parts.append(rod((x,0,.54),(x,0,.79),.024,metal));parts.append(cube('Chair arm',(x,.01,.80),(.09,.38,.07),dark,.033))
for o in parts:o.parent=chair
for f,r,x,y in [(1,-.55,.36,-.78),(15,-.55,.36,-.78),(31,0,.15,-.59),(51,0,.15,-.59),(60,-.55,.36,-.78)]:
    chair.rotation_euler[2]=r;chair.location.x=x;chair.location.y=y;chair.keyframe_insert('rotation_euler',frame=f);chair.keyframe_insert('location',frame=f)
for f,e in [(1,0),(28,0),(37,1.3),(51,1.3),(60,0)]:ss.inputs['Emission Strength'].default_value=e;ss.inputs['Emission Strength'].keyframe_insert('default_value',frame=f)
# Soft studio illumination and orthographic product-shot camera.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True
scene.world.color=(.22,.22,.22)
for pos,power,size,color in [((-3,-4,6),350,5,(.83,.91,1)),((1,2,5),450,3,(1,.79,.58)),((4,-1,3),140,4,(.55,.72,1))]:
    bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.data.color=color;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(-5,-7,5.0));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=5.7;scene.camera=cam
scene.render.resolution_x=540;scene.render.resolution_y=460;scene.render.resolution_percentage=100;scene.render.film_transparent=True
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.fps=12;scene.frame_start=1;scene.frame_end=60
scene.frame_set(42);scene.render.filepath=os.path.join(OUT,'preview.png');bpy.ops.render.render(write_still=True)
print('LOADER_PREVIEW_READY',flush=True)
scene.render.filepath=os.path.join(OUT,'frame_');bpy.ops.render.render(animation=True)
print('LOADER_FRAMES_READY',flush=True)
