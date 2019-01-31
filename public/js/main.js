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
        load_model(model.name).then((data)=>{
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
        let info = model.materials[node.name]
        if (info ){
            if (!info.material){
                info.material = create_material(
                    info.type,
                    info.defuse,
                    info.normals,
                    info.rmo,
                    parseFloat(info.metalness),
                    parseFloat(info.roughness),
                    node.type==='SkinnedMesh'?true:false
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
    $.MODEL_INFO.concat_animation_with_model.el.innerHTML = ''
    for (let model of models){
        let m = model[1]
        if (m.active){
            let option = document.createElement('option')
            option.value = m.name
            option.innerHTML = m.name
            $.MODEL_INFO.concat_animation_with_model.el.appendChild(option)    
        }          
    }
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
    model.concat_animation_with_model = $.MODEL_INFO.concat_animation_with_model.el.value
    model.concat_animation_name = $.MODEL_INFO.concat_animation_name.el.value
    //
    value = $.MODEL_INFO.name.el.value
    if (value!==selected_model_name){
        /*
        model.name = value
        models.set(value,model)
        models.delete(selected_model_name)
        $.LIST.models.remove(selected_model_name)
        $.LIST.models.add(value)
        */
    }
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
        model: model.name,
        active: model.active,
        position: model.position,
        scale: model.scale,
        rotation: model.rotation,
        concat_animation_with_model: model.concat_animation_with_model,
        concat_animation_name: model.concat_animation_name
    })
}

const create_material = (type,defuse,normals,rmo,metalness,roughness,skinned)=>{
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
       	//side          : THREE.DoubleSide,
        map           : _defuse,
        normalMap     : _normals,
        metalnessMap  : _rmo,
        roughnessMap  : _rmo,
        aoMap         : _rmo,
        skinning      : skinned,
        metalness     : metalness,
        roughness     : roughness
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
        selected_object.type==='SkinnedMesh'?true:false
    )

    selected_object.material = material

    send_json({
        c:'object',
        model: selected_model_name,
        object: selected_object.name,
        type: type,
        defuse: defuse,
        normals: normals,
        rmo: rmo,
        metalness: material.metalness,
        roughness: material.roughness,
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

async function create_bundle(){
    let emptyMaterial = new THREE.MeshStandardMaterial()

    for (let a of models){
        let model = a[1]
        if (!model.mesh){
            let data = await load_model(model.name)
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
            if (el.mesh && el.active){

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
                el.mesh.traverse((node)=>{
                    if (node.type==='SkinnedMesh' || node.type==='Mesh'){
                        node.material = emptyMaterial
                    }
                })
                //
                el.mesh.name = el.name
                scene.add(el.mesh)
            }
        }
        if (el.concat_animation_with_model!==''){
            let anim = el.data.animations[0]
            anim.name = el.concat_animation_with_model+'.'+el.concat_animation_name
            animations.push(anim)
        }
    })

    let exporter = new THREE.GLTFExporter();
    exporter.parse( scene, function ( gltf ) {
        console.log( gltf );
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