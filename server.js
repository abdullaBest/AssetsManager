"use strict";

/*
    
    copyright 2019 Hamzin Abdulla (abdulla_best@mail.ru)
*/

console.log('Process versions: ',process.versions)

const path             = require('path')
const fs               = require('fs')


console.log('запускаем сервер обмена данными.');

const express = require('express')

let SERVER = express()
SERVER.use(express.static(__dirname + '/public'))
SERVER.listen(4000)
// WS
const WebSocketServer = require('ws').Server
let WS = new WebSocketServer({
  port: 4001,
  perMessageDeflate:false,
  //maxPayload : 16777216,
  //server: app
  //path: '/d',
})

let ws = null
WS.on('connection', function(_ws) { 
  ws = _ws
  ws.on('message', user_message );
})

function send_json(message){
  if (ws===null) { return }
  if (ws.readyState===1){
      try{
          ws.send(JSON.stringify(message))
      }catch(e){
          console.log(message);
      }
  }else{
      ws.close();
  }
}
//=================================================================

let assets = {
  in: {}, // модели FBX
  t: {}   // текстуры
}
try{
  let _assets = JSON.parse(fs.readFileSync(path.join(__dirname,'assets.json')))
  assets.in = _assets.in
  assets.t = _assets.t
}catch(e){

}

// проверяет новые файлы в папке in и обрабатывает их
function check_in(){
  let child_process = require('child_process');
  let ready = 0

  fs.readdir('in', (err, files) => {
    for (let i=0;i<files.length;i++){
      let file = files[i]
      let basename = path.basename(file).split('.')[0].toLowerCase()
      let stat = fs.statSync(path.join('in',file))
      
      if (stat.isDirectory()) {
        continue
      }
      
      let need_update = false;

      let info = assets.in[basename]
      if (info===undefined){
        info = {
          name      : basename,
          filename  : file,
          position  : [0,0,0],
          scale     : [1,1,1],
          rotation  : [0,0,0],
          active    : true,
          concat_bones_with_model: '',
          concat_animation_with_model: '',
          concat_animation_name      : '',
          ctime     : stat.ctime.toString(),
          materials : {}
        }
        assets.in[basename] = info
        need_update = true

      }else{

        if (info.ctime!==stat.ctime.toString()){
          info.ctime  = stat.ctime.toString()
          need_update = true
        }

      }

      if(need_update){
        child_process.exec('FBX2glTF-windows-x64.exe --binary --verbose --no-flip-v --input in/'+info.filename+' --output public/models/'+info.filename, function(error, stdout, stderr) {
          console.log(stdout);
        })
      }
      
    }

    ready = ready + 1
    if (ready === 2){
      fs.writeFileSync(path.join(__dirname,'assets.json'),JSON.stringify(assets))
    }

  })

  fs.readdir('public/textures', (err, files) => {
    for (let i=0;i<files.length;i++){
      let file = files[i]
      let basename = path.basename(file).split('.')[0].toLowerCase()
      let stat = fs.statSync(path.join('public','textures',file))
      
      if (stat.isDirectory()) {
        continue
      }

      let info = assets.t[basename]
      if (info===undefined){
        info = {
          name     : basename,
          filename : file,
          active   : true,
          ctime    : stat.ctime.toString(),
        }
        assets.t[basename] = info

      }else{

        if (info.ctime!==stat.ctime.toString()){
          info.ctime = stat.ctime.toString()
        }

      }
    }

    ready = ready + 1
    if (ready === 2){
      fs.writeFileSync(path.join(__dirname,'assets.json'),JSON.stringify(assets))
    }
  })

}

check_in()

fs.watch('in',()=>{
  check_in()
  send_json({
    c: 'list',
    list: assets
  })
})

fs.watch('public/textures',()=>{
  check_in()
  send_json({
    c: 'list',
    list: assets
  })
})

const user_message = (message)=>{
  let child_process = require('child_process');
  //console.log(message)
  let a = JSON.parse(message)
  switch (a.c){
    case 'list':
      send_json({
        c: 'list',
        list: assets
      })        
      break
    case 'model':{
      assets.in[a.model].active   = a.active
      assets.in[a.model].name     = a.name
      assets.in[a.model].position = a.position
      assets.in[a.model].scale    = a.scale
      assets.in[a.model].rotation = a.rotation
      assets.in[a.model].concat_bones_with_model     = a.concat_bones_with_model
      assets.in[a.model].concat_animation_with_model = a.concat_animation_with_model
      assets.in[a.model].concat_animation_name       = a.concat_animation_name
      fs.writeFileSync(path.join(__dirname,'assets.json'),JSON.stringify(assets))
    }
    break
    case 'object':{
        assets.in[a.model].materials[a.object]={
          type        : a.type,
          defuse      : a.defuse,
          normals     : a.normals,
          rmo         : a.rmo,
          metalness   : a.metalness,
          roughness   : a.roughness,
          transparent : a.transparent,
        }
        fs.writeFileSync(path.join(__dirname,'assets.json'),JSON.stringify(assets))
      }
      break
    case 'bundle':{
        fs.writeFileSync(path.join(__dirname,'public','bundle.gltf'),a.gltf)
        let result = child_process.execSync('WindowsMRAssetConverter public/bundle.gltf -min-version latest -compress-meshes -o public/bundle.glb');
        console.log(result.toString())

        let bundle = {
          models: {},
          textures: {}
        }
        for (let name in assets.in){
          let model = assets.in[name]
          if (model.active){
            bundle.models[model.name]={
              name      : model.name,
              materials : model.materials
            }
          }
        }
        for (let name in assets.t){
          let texture = assets.t[name]
          bundle.textures[texture.name]={
            filename : texture.filename
          }
        }
        //
        fs.writeFileSync(path.join(__dirname,'public','bundle.json'),JSON.stringify(bundle))  
        console.log('finish')
      }
      break
  }
}