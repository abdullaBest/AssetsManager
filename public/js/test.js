"use strict"
/*
    
    copyright 2019 Hamzin Abdulla (abdulla_best@mail.ru)
*/

let GLTFLoader = new THREE.GLTFLoader()
THREE.DRACOLoader.setDecoderPath( 'js/lib/draco/gltf/' )
GLTFLoader.setDRACOLoader( new THREE.DRACOLoader() )

let textureLoader = new THREE.TextureLoader()


render_prepare()

//-------------------------------------------------
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
//-------------------------------------------------

animate()

//---------------------------------------------------
const Assets = Object.seal({
    textures: new Map(),
    models: new Map(),
    gltf : null,
    prepare: function(_models,_textures){
        for (let name in _textures){
            this.textures.set(name, textureLoader.load('textures/'+_textures[name].filename))
        }
        for (let name in _models){
            let mesh = this.gltf.scene.children.find(el=>el.name===name)
            if (!mesh){ continue }
            let info = _models[name]
            mesh.traverse((node)=>{
                let o = info.materials[node.name]
                if (o){
                    node.material = new THREE[o.type]({
                        //side          : THREE.DoubleSide,
                        map           : o.defuse?this.textures.get(o.defuse):null,
                        normalMap     : o.normals?this.textures.get(o.normals):null,
                        metalnessMap  : o.rmo?this.textures.get(o.rmo):null,
                        roughnessMap  : o.rmo?this.textures.get(o.rmo):null,
                        aoMap         : o.rmo?this.textures.get(o.rmo):null,
                        skinning      : node.type==='SkinnedMesh',
                        metalness     : o.metalness,
                        roughness     : o.roughness
                    })
                }
            })
            //
            let animations = {}
            for (let i=0;i<this.gltf.animations.length;i++){
                let anim = this.gltf.animations[i]
                if (anim.name.indexOf(name+'.')===0){
                    animations[anim.name] = anim
                }
            }
            //
            this.models.set(name,{
                name : name,
                mesh : mesh,
                animations: animations
            })
        }
    }
})



GLTFLoader.load('bundle.glb',(data)=>{
    Assets.gltf = data
    fetch('bundle.json').then((response)=>{
        return response.json()
    }).then((data)=>{
        Assets.prepare(data.models,data.textures)
        //
        let model = Assets.models.entries().next().value[1]; // Assets.models.get('')
        if (Object.keys(model.animations).length!==0){
            let mixer = new THREE.AnimationMixer( model.mesh )
            let currentAction = mixer.clipAction( Object.keys(model.animations)[0] )
            currentAction.play()
            RENDER.mixers.push(mixer)
        }

        RENDER.scene.add(model.mesh)
    })
},null,(err)=>{
    console.log(err)
})
