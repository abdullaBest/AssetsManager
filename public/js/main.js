"use strict"
/*
    
    copyright 2019 Hamzin Abdulla (abdulla_best@mail.ru)
*/

render_prepare();       //

let models = new Map()
let selected_model_name = ''
let selected_object = null
let textures = new Map()
let currentAction = null

let GLTFLoader = new THREE.GLTFLoader()
THREE.DRACOLoader.setDecoderPath( 'js/lib/draco/gltf/' )
GLTFLoader.setDRACOLoader( new THREE.DRACOLoader() )

let textureLoader = new THREE.TextureLoader()


$.prepare.then(()=>{
    let light1 = new THREE.HemisphereLight( 0x666666, 0x222222 );
	light1.position.set( 0, 1, 0 );
	RENDER.scene.add( light1 );

	let light = new THREE.DirectionalLight( 0xffffff, 1.0 );
	light.position.set( 10, 10, 10 );
    RENDER.scene.add( light );

    light = new THREE.DirectionalLight( 0xffffff, 1.0 );
	light.position.set( -10, 10, -10 );
    RENDER.scene.add( light );

    var axesHelper = new THREE.AxesHelper( 5 );
    RENDER.scene.add( axesHelper );

    var size = 10;
    var divisions = 10;

    var gridHelper = new THREE.GridHelper( size, divisions );
    RENDER.scene.add( gridHelper );

    RENDER.camera.position.set( 10, 10, 0 );

    animate()
})


const load_model = (name)=>{
    return new Promise((resolve,reject)=>{
        GLTFLoader.load('models/'+name+'.glb',(data)=>{
            resolve(data)
        },null,(err)=>{
            console.log(err)
            reject(err)
        })
    })
}

$.LIST.models.onselect = (name)=>{
    if (selected_model_name!==''){
        let model = models.get(selected_model_name)
        if (model.mesh){
            RENDER.scene.remove(model.mesh)
        }
    }
    let model = models.get(name)
    selected_model_name = name
    if (!model.mesh){
        load_model(model.filename).then((data)=>{
            model.data = data
            model.mesh = data.scene.children[0]
            apply_materials(model)
            RENDER.scene.add(model.mesh)
            animations_show()
            scene_show()
        })
    }else{
        apply_materials(model)
        RENDER.scene.add(model.mesh)
        animations_show()
        scene_show()
    }
    fill_model_info()
}

$.LIST.filter_active.el.onclick = ()=>{
    for (let i=0;i<$.LIST.models.el.children.length;i++){
        let el = $.LIST.models.el.children[i]
        let name = el.getAttribute('name')
        if (!models.get(name).active){ 
            el.style.display = 'none'
        }
    }
}

$.LIST.filter_all.el.onclick = ()=>{
    for (let i=0;i<$.LIST.models.el.children.length;i++){
        let el = $.LIST.models.el.children[i]
        el.style.display = ''
    }
}

const apply_materials = (model)=>{
    model.mesh.traverse((node)=>{
        let info
        if (model.mesh.type==='Object3D' && model.mesh.children.length===1 && model.mesh.children[0].children.length===0){
            info = model.materials[model.name]
        }else{
            info = model.materials[node.name]
        }
        if (info ){
            if (!info.material){
                info.material = create_material(
                    info.type,
                    info.defuse,
                    info.normals,
                    info.rmo,
                    parseFloat(info.metalness),
                    parseFloat(info.roughness),
                    node.type==='SkinnedMesh'?true:false,
                    info.transparent,
                    info.dside,
                )
            }
            node.material = info.material
        }
    })
}

const animations_show = ()=>{
    if (currentAction!==null){
        currentAction.stop()
        currentAction = null
    }
    $.MODEL_INFO.animation_list.el.innerHTML = ''
    let model = models.get(selected_model_name)
    if (!model.data){ return } 
    for (let i=0;i<model.data.animations.length;i++){
        let anim = model.data.animations[i]
        let option = document.createElement('option')
        option.innerText = anim.name
        option.value = anim.uuid
        $.MODEL_INFO.animation_list.el.appendChild(option)
    }    
}

const scene_show = ()=>{
    $.SCENE.tree.el.innerHTML = ''
    let model = models.get(selected_model_name)
    if (!model.mesh){ return } 
    model.mesh.traverse((node)=>{
        if (node.type==='SkinnedMesh' || node.type==='Mesh'){
            let div = document.createElement('div')
            div.setAttribute('uuid',node.uuid)
            div.style.padding = '0 0 0 10px'
            div.innerText = node.name+' '+node.type
            //
            div.addEventListener('click',select_mesh)
            //
            parent = $.SCENE.tree.el
            if (node.parent){
                parent = $.SCENE.tree.el.querySelector('div[uuid="'+node.parent.uuid+'"]')
                if (!parent){
                    parent = $.SCENE.tree.el
                }
            }
            parent.appendChild(div)
        }
    })
}

$.MODEL_INFO.play.el.onclick=(e)=>{
    let model = models.get(selected_model_name)
    if (!model.data){ return } 

    let uuid = $.MODEL_INFO.animation_list.el.value
    let animation = model.data.animations.find(el=>el.uuid === uuid)
    if (!animation) {
        return
    }

    if (currentAction!==null){
        currentAction.stop()
    }

    let mixer = new THREE.AnimationMixer( model.mesh )
    currentAction = mixer.clipAction( animation )
    currentAction.play()

    RENDER.mixers = [mixer]
}

$.MODEL_INFO.stop.el.onclick=(e)=>{

    if (currentAction!==null){
        currentAction.stop()
    }
}

const select_mesh = (e)=>{
    e.cancelBubble = true

    let model = models.get(selected_model_name)
    if (!model.mesh){ return } 

    if (selected_object!==null){
        let div = $.SCENE.tree.el.querySelector('div[uuid="'+selected_object.uuid+'"]')
        if (div){
            div.style.backgroundColor = ''
            div.style.color = ''
        }
    }

    let uuid = e.target.getAttribute('uuid')
    model.mesh.traverse((node)=>{
        if (node.uuid===uuid){
            selected_object = node
        }
    })

    console.log(selected_object)

    let div = $.SCENE.tree.el.querySelector('div[uuid="'+selected_object.uuid+'"]')
    div.style.backgroundColor = 'blue'
    div.style.color = 'white'


    if (selected_object.material){
        $.OBJECT.material.el.value = selected_object.material.type
        $.OBJECT.defuse.el.value = selected_object.material.map?selected_object.material.map.name:''
        $.OBJECT.normals.el.value = selected_object.material.normalMap?selected_object.material.normalMap.name:''
        $.OBJECT.rmo.el.value = selected_object.material.metalnessMap?selected_object.material.metalnessMap.name:''
        $.OBJECT.metalness.el.value = selected_object.material.metalness
        $.OBJECT.roughness.el.value = selected_object.material.roughness
        $.OBJECT.transparent.el.checked = selected_object.material.transparent
        $.OBJECT.dside.el.checked = selected_object.material.side===THREE.DoubleSide
    }

}

$.MODEL_INFO.change_name.el.addEventListener('click',model_info_change)
$.MODEL_INFO.position.x.el.addEventListener('change',model_info_change)
$.MODEL_INFO.position.y.el.addEventListener('change',model_info_change)
$.MODEL_INFO.position.z.el.addEventListener('change',model_info_change)
$.MODEL_INFO.scale.x.el.addEventListener('change',model_info_change)
$.MODEL_INFO.scale.y.el.addEventListener('change',model_info_change)
$.MODEL_INFO.scale.z.el.addEventListener('change',model_info_change)
$.MODEL_INFO.active.el.addEventListener('change',model_info_change)
$.MODEL_INFO.name.el.addEventListener('change',model_info_change)
$.MODEL_INFO.concat_bones_with_model.el.addEventListener('change',model_info_change)
$.MODEL_INFO.concat_animation_with_model.el.addEventListener('change',model_info_change)
$.MODEL_INFO.concat_animation_name.el.addEventListener('change',model_info_change)

function fill_model_info(){
    let model = models.get(selected_model_name)
    if (!model){
        return
    }
    $.MODEL_INFO.name.el.value = model.name
    $.MODEL_INFO.position.x.el.value = model.position[0]
    $.MODEL_INFO.position.y.el.value = model.position[1]
    $.MODEL_INFO.position.z.el.value = model.position[2]
    $.MODEL_INFO.scale.x.el.value = model.scale[0]
    $.MODEL_INFO.scale.y.el.value = model.scale[1]
    $.MODEL_INFO.scale.z.el.value = model.scale[2]
    $.MODEL_INFO.active.el.checked = model.active
    // заполняем список моделей
    $.MODEL_INFO.concat_bones_with_model.el.innerHTML = '<option value=""></option>'
    $.MODEL_INFO.concat_animation_with_model.el.innerHTML = '<option value=""></option>'
    for (let model of models){
        let m = model[1]
        if (m.active){
            let option = document.createElement('option')
            option.value = m.name
            option.innerHTML = m.name
            $.MODEL_INFO.concat_animation_with_model.el.appendChild(option)    
            option = document.createElement('option')
            option.value = m.name
            option.innerHTML = m.name
            $.MODEL_INFO.concat_bones_with_model.el.appendChild(option)    
        }          
    }
    $.MODEL_INFO.concat_bones_with_model.el.value = model.concat_bones_with_model
    $.MODEL_INFO.concat_animation_with_model.el.value = model.concat_animation_with_model
    $.MODEL_INFO.concat_animation_name.el.value = model.concat_animation_name

}

function model_info_change(){
    let model = models.get(selected_model_name)
    if (!model){
        return
    }
    let value
    value = parseFloat($.MODEL_INFO.position.x.el.value)
    if (!isNaN(value)) {
        model.position[0] = value
    }
    value = parseFloat($.MODEL_INFO.position.y.el.value)
    if (!isNaN(value)) {
        model.position[1] = value
    }
    value = parseFloat($.MODEL_INFO.position.z.el.value)
    if (!isNaN(value)) {
        model.position[2] = value
    }
    value = parseFloat($.MODEL_INFO.scale.x.el.value)
    if (!isNaN(value)) {
        model.scale[0] = value
    }
    value = parseFloat($.MODEL_INFO.scale.x.el.value)
    if (!isNaN(value)) {
        model.scale[1] = value
    }
    value = parseFloat($.MODEL_INFO.scale.z.el.value)
    if (!isNaN(value)) {
        model.scale[2] = value
    }
    model.active = $.MODEL_INFO.active.el.checked
    model.name   = $.MODEL_INFO.name.el.value
    model.concat_bones_with_model = $.MODEL_INFO.concat_bones_with_model.el.value
    model.concat_animation_with_model = $.MODEL_INFO.concat_animation_with_model.el.value
    model.concat_animation_name = $.MODEL_INFO.concat_animation_name.el.value
    //
    if (model.mesh){
        model.mesh.position.x = model.position[0]
        model.mesh.position.y = model.position[1]
        model.mesh.position.z = model.position[2]
        model.mesh.scale.x = model.scale[0]
        model.mesh.scale.y = model.scale[1]
        model.mesh.scale.z = model.scale[2]
        model.mesh.rotation.x = model.rotation[0]
        model.mesh.rotation.y = model.rotation[1]
        model.mesh.rotation.z = model.rotation[2]
    }
}

$.MODEL_INFO.save.el.onclick=()=>{
    let model = models.get(selected_model_name)
    if (!model){
        return
    }
    send_json({
        c:'model',
        model   : selected_model_name,
        name    : model.name,
        active  : model.active,
        position: model.position,
        scale   : model.scale,
        rotation: model.rotation,
        concat_bones_with_model: model.concat_bones_with_model,
        concat_animation_with_model: model.concat_animation_with_model,
        concat_animation_name: model.concat_animation_name
    })
}

const create_material = (type,defuse,normals,rmo,metalness,roughness,skinned,transparent,dside)=>{
    let _defuse = defuse!==''?textures.get(defuse).txt:null
    let _normals = normals!==''?textures.get(normals).txt:null
    let _rmo = rmo!==''?textures.get(rmo).txt:null

/*
    'MeshBasicMaterial'
    'MeshLambertMaterial'
    'MeshPhongMaterial'
    'MeshPhysicalMaterial'
    'MeshStandardMaterial'
*/
    let material = new THREE[type]({
        map           : _defuse,
        normalMap     : _normals,
        metalnessMap  : _rmo,
        roughnessMap  : _rmo,
        aoMap         : _rmo,
        skinning      : skinned,
        metalness     : metalness,
        roughness     : roughness,
        transparent   : transparent,
        side          : dside?THREE.DoubleSide:THREE.FrontSide
    })

    return material
}

$.OBJECT.apply.el.onclick=()=>{
    if (!selected_object || !selected_object.material){
        return
    }

    let type = $.OBJECT.material.el.value
    let defuse = $.OBJECT.defuse.el.value
    let normals = $.OBJECT.normals.el.value
    let rmo = $.OBJECT.rmo.el.value
    let material = create_material(
        type,
        defuse,
        normals,
        rmo,
        parseFloat($.OBJECT.metalness.el.value),
        parseFloat($.OBJECT.roughness.el.value),
        selected_object.type==='SkinnedMesh'?true:false,
        $.OBJECT.transparent.el.checked,
        $.OBJECT.dside.el.checked,
    )

    selected_object.material = material

    let name = selected_object.name
    let model = models.get(selected_model_name)
    if (model.mesh.type==='Object3D' && model.mesh.children.length===1 && model.mesh.children[0].children.length===0){
        name = selected_model_name
    }

    send_json({
        c           :'object',
        model       : selected_model_name,
        object      : name,
        type        : type,
        defuse      : defuse,
        normals     : normals,
        rmo         : rmo,
        metalness   : material.metalness,
        roughness   : material.roughness,
        transparent : material.transparent,
        dside       : material.side===THREE.DoubleSide,
    })

}
//==============================================================================================
let socket = null
// отправляет сообщение на сервер
function send_json(d){ 
    if (socket!==null && socket.readyState===1){
        socket.send(JSON.stringify(d)); 
    }
}

function net_prepare(){
    let _url = location.hostname+':4001';
    socket = new WebSocket('ws://'+_url)

    socket.binaryType ='arraybuffer';
    socket.onopen     = ()=>{
        send_json({
            c : 'list'
        })
    }
    socket.onmessage  = (message)=>{
        //console.log(message.data)
        let a = JSON.parse(message.data)
        switch (a.c){
            case 'list':
                // модели
                let list = a.list.in;
                for (let name in list){
                    let model = models.get(name) 
                    if (!model){
                        models.set(name,list[name])
                    }
                    $.LIST.models.add(name)
                }
                $.LIST.filter_active.el.click()
                // текстуры
                for (let name in a.list.t){
                    let t = a.list.t[name]
                    textures.set(name,t)
                    t.txt = textureLoader.load('textures/'+t.filename)
                    t.txt.name = name
                    let option
                    if (t.name.indexOf('_base')!==-1 || (t.name.indexOf('_normal')===-1 && t.name.indexOf('_rmo')===-1)){
                        if ($.OBJECT.defuse.el.querySelector('option[value="'+t.name+'"]')===null){
                            option = document.createElement('option')
                            option.value = t.name
                            option.innerText = t.name
                            $.OBJECT.defuse.el.appendChild(option)
                        }
                    }
                    if (t.name.indexOf('_normal')!==-1){
                        if ($.OBJECT.normals.el.querySelector('option[value="'+t.name+'"]')===null){
                            option = document.createElement('option')
                            option.value = t.name
                            option.innerText = t.name
                            $.OBJECT.normals.el.appendChild(option)
                        }
                    }
                    if (t.name.indexOf('_rmo')!==-1){
                        if ($.OBJECT.rmo.el.querySelector('option[value="'+t.name+'"]')===null){
                            option = document.createElement('option')
                            option.value = t.name
                            option.innerText = t.name
                            $.OBJECT.rmo.el.appendChild(option)
                        }
                    }
                }
            break;
        }

    }

    //socket.onclose    = net_onclose; 
}
net_prepare()

//==============================================================================================
$.MAIN.create_bundle.el.onclick = ()=>{
    create_bundle()
}

async function test(){
    for (let a of models){
        let model = a[1]
        if (!model.mesh){
            let data = await load_model(model.filename)
            model.data = data
            model.mesh = data.scene.children[0]
            apply_materials(model)
        }
    }

    let model_a = models.get('girl_set1_arms').mesh
    model_a.traverse(node=>{
        console.log(node,node.scale)
    })
    console.log('------------')
    let model_b = models.get('girl_set2_arms').mesh
    model_b.traverse(node=>{
        console.log(node,node.scale)
    })
//    RENDER.scene.add(.children[4])
//    RENDER.scene.add(models.get('girl_set2_arms').mesh.children[4])
/*    let a = models.get('girl_set1_arms').mesh.children[4].geometry.attributes.position.array
    let b = models.get('girl_set2_arms').mesh.children[4].geometry.attributes.position.array
    for (let i=0;i<a.length;i++){
        console.log(a[i]-b[i])
    }
*/
}

// настраивает анимацию одной модели для другой
//
function prepare_animations(model){
    let src = null
    for (let a of models){
        let m = a[1]
        if (m.name===model.concat_animation_with_model){
            src = m.mesh
            break
        }
    }
    if (src===null){
        return
    }
    //
    let mesh_src = null
    src.traverse(node => {
      if (node.isSkinnedMesh && mesh_src===null) {
        mesh_src = node
      }
    })    
    let mesh_dst = null
    model.mesh.traverse(node=>{
      if (node.isSkinnedMesh){
        mesh_dst = node
      }
    })

    const EPSILON = 0.0001
    
    let anim = model.data.animations[0].tracks
    
    for (let i=0;i<mesh_src.skeleton.bones.length;i++){
        let b1 = mesh_src.skeleton.bones[i]
        let b2 = null
        for (let i=0;i<mesh_dst.skeleton.bones.length;i++){
            let b = mesh_dst.skeleton.bones[i]
            if (b.name===b1.name){
                b2=b
                break
            }
        }
        
        if (b2===null){
            continue
        }
        
        let dx = Math.abs(b1.position.x-b2.position.x) 
        let dy = Math.abs(b1.position.y-b2.position.y) 
        let dz = Math.abs(b1.position.z-b2.position.z) 
        if ( dx>EPSILON || dy>EPSILON || dz>EPSILON ){
            let yep = false
            let name = b1.name+'.position'
            for (let j=0;j<anim.length;j++){
                if (anim[j].name===name){
                    yep = true
                    break
                }
            }
            if (!yep){
                let q = new THREE.VectorKeyframeTrack(name,[0],[b2.position.x,b2.position.y,b2.position.z])
                anim.push(q)
            }
        }
        dx = Math.abs(b1.quaternion.x - b2.quaternion.x)
        dy = Math.abs(b1.quaternion.y - b2.quaternion.y)
        dz = Math.abs(b1.quaternion.z - b2.quaternion.z)
        let dw = Math.abs(b1.quaternion.w - b2.quaternion.w)
        if ( dx>EPSILON || dy>EPSILON || dz>EPSILON || dw>EPSILON ){
            let yep = false
            let name = b1.name+'.quaternion'
            for (let j=0;j<anim.length;j++){
                if (anim[j].name===name){
                    yep = true
                    break
                }
            }
            if (!yep){
                let q = new THREE.QuaternionKeyframeTrack(name,[0],[b2.quaternion.x,b2.quaternion.y,b2.quaternion.z,b2.quaternion.w])
                anim.push(q)
            }
        }
    }
}

// настраивает кости одной модели под другую модель
//
//
function rearange_bones(model){
    if (model.concat_bones_with_model===''){
        return
    }
    let src = null
    for (let a of models){
        let m = a[1]
        if (m.name===model.concat_bones_with_model){
            src = m.mesh
            break
        }
    }
    if (src===null){
        return
    }
    //
    let mesh_src = null
    src.traverse(node => {
      if (node.isSkinnedMesh && mesh_src===null) {
        mesh_src = node
      }
    })    
    let mesh_dst = null
    model.mesh.traverse(node=>{
      if (node.isSkinnedMesh){
        mesh_dst = node
      }
    })
    if (mesh_dst===null || mesh_src===null){
        return
    }
    // перемножаем скейлы если размеры геометрии не совпадают, такое редко но бывает
    // спасибо моделлеру с которым я работаю, новая модель новый вызов)
    let scale_dx = mesh_dst.scale.x
    let scale_dy = mesh_dst.scale.y
    let scale_dz = mesh_dst.scale.z
    let scale_sx = scale_dx/mesh_src.scale.x
    let scale_sy = scale_dy/mesh_src.scale.y
    let scale_sz = scale_dz/mesh_src.scale.z
    let b = mesh_dst.geometry.attributes.position.array
    mesh_dst.scale.x = 1.0
    mesh_dst.scale.y = 1.0
    mesh_dst.scale.z = 1.0
    for (let i=0;i<b.length;i=i+3){
        b[i+0] = b[i+0]*scale_sx
        b[i+1] = b[i+1]*scale_sy
        b[i+2] = b[i+2]*scale_sz
    }

    //
    let bones_t = []
    let err = false
    for (let i=0;i<mesh_dst.skeleton.bones.length;i++){
        let name = mesh_dst.skeleton.bones[i].name
        let yep = false
        for(let j=0;j<mesh_src.skeleton.bones.length;j++){
            let name2 = mesh_src.skeleton.bones[j].name
            if (name===name2){
                yep = true
                bones_t.push(j)
                break
            }
        }
        if (!yep){
            console.log(model.name+': not founded bone',name)
            err = true
            bones_t.push(i)
        }
    }
    let a = mesh_dst.geometry.attributes.skinIndex
    for (let i=0;i<a.array.length;i++){
        let n = a.array[i]
        a.array[i] = bones_t[n]
    }
    mesh_dst.skeleton = mesh_src.skeleton
    
    if (err){
        alert('есть ошибки смотри консоль')
        return
    }
}

// убираем не нужную группу для единичной меш
function remove_group(el){
    if (el.mesh.type!=='Object3D' || el.mesh.children.length!==1){
        return el.mesh
    }

    let c = el.mesh.children[0]
    if (c.type!=='Object3D' || c.children.length!==0){
        return el.mesh
    }
    c.updateMatrix()

    //
    let v = new THREE.Vector3( 0, 0, 0 )

    let n = c.geometry.attributes.normal
    let p = c.geometry.attributes.position
    //let u = c.geometry.attributes.uv

    for (let i=0;i<p.count;i++){
        v.x = n.array[i*3+0]
        v.y = n.array[i*3+1]
        v.z = n.array[i*3+2]
        v.applyMatrix4(c.matrix)

        n.array[i*3+0] = v.x
        n.array[i*3+1] = v.y
        n.array[i*3+2] = v.z

        v.x = p.array[i*3+0]
        v.y = p.array[i*3+1]
        v.z = p.array[i*3+2]
        v.applyMatrix4(c.matrix)

        p.array[i*3+0] = v.x
        p.array[i*3+1] = v.y
        p.array[i*3+2] = v.z
    }
    //
    c.position.x = 0
    c.position.y = 0
    c.position.z = 0
    c.scale.x = 1
    c.scale.y = 1
    c.scale.z = 1
    c.rotation.x = 0
    c.rotation.y = 0
    c.rotation.z = 0
    c.updateMatrix()

    return c
}

async function create_bundle(){
    let emptyMaterial = new THREE.MeshStandardMaterial()
    let emptySkinnedMaterial = new THREE.MeshStandardMaterial({
      skinning : true,  
    })

    for (let a of models){
        let model = a[1]
        if (!model.mesh){
            let data = await load_model(model.filename)
            model.data = data
            model.mesh = data.scene.children[0]
            apply_materials(model)
        }
    }
    //
    let animations = []

    let scene = new THREE.Scene()

    models.forEach(el=>{
        if (el.active){
            // перенастраиваем косточки если нужно
            rearange_bones(el)

            if (el.mesh){
                //убираем группу для единичных объектов
                let mesh = remove_group(el)

                if (el.concat_animation_name!==''){
                    if (el.data.animations.length!==0){
                        let anim = el.data.animations[0]
                        anim.name = el.name+'.'+el.concat_animation_name
                    }
                }else{
                    if (el.data.animations.length!==0){
                        let anim = el.data.animations[0]
                        anim.name = el.name+'.'+anim.name
                    }
                }
                animations = animations.concat(el.data.animations)
                //
                mesh.traverse((node)=>{
                    if (node.type==='Mesh'){
                        node.material = emptyMaterial
                    }
                    if (node.type==='SkinnedMesh'){
                        node.material = emptySkinnedMaterial
                    }
                })
                if (mesh.type==='Mesh'){
                    mesh.material = emptyMaterial
                }
                if (mesh.type==='SkinnedMesh'){
                   mesh.material = emptySkinnedMaterial
                }
                //
                mesh.name = el.name
                scene.add(mesh)
            }
        }
        if (el.concat_animation_with_model!==''){
            prepare_animations(el)
            let anim = el.data.animations[0]
            anim.name = el.concat_animation_with_model+'.'+el.concat_animation_name
            animations.push(anim)
        }
    })

    let exporter = new THREE.GLTFExporter();
    exporter.parse( scene, function ( gltf ) {
        //console.log( gltf );
        send_json({
            c:'bundle',
            gltf: JSON.stringify(gltf)
        })
    }, 
    {
        embedImages: false,
        animations: animations, 
    })
    //    
}