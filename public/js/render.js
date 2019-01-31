"use strict"
/*
    
    copyright 2019 Hamzin Abdulla (abdulla_best@mail.ru)
*/
// рендер
let RENDER = Object.seal({
    canvas          : null,
    WIDTH           : window.innerWidth,
    HEIGHT          : window.innerHeight,
    
    scene           : null,
    background      : null,
    
    renderer        : null,
    camera          : null,
    camera_ortho    : null,
    controls        : null,
    light           : null,
    listener        : null,
    composer        : null,
    effectFXAA      : null,
    bloomPass       : null,
    copypass        : null,
    mixers          : [],
    
    scale           : 4.5,
    scale_to        : 4.5,
    _scale_to       : 4.5,
    scale_delta     : 0,
    aspect          : 1.0,
    
    lastframe_time  : 0,

    camera_pos1     : { x:4, y:20 },

    camera_vector   : {x:0,y:0,z:0},
    _camera_vx      : {x:0,y:0,z:0},
    _camera_vz      : {x:0,y:0,z:0},

    animframeID     : 0,

    raycaster           : new THREE.Raycaster(),
    mouse               : new THREE.Vector3(),
    
    terrain_material    : null,

    mixers          : [],
});

function _deg_to_rad(deg){ return deg*Math.PI/180; }
function _rad_to_deg(rad){ return rad*180/Math.PI; }

function renderResize(){
    RENDER.WIDTH         = window.innerWidth;
    RENDER.HEIGHT        = window.innerHeight;
    RENDER.aspect        = RENDER.WIDTH/RENDER.HEIGHT;

    RENDER.camera.aspect = RENDER.aspect;
    RENDER.renderer.setSize( window.innerWidth, window.innerHeight );
    RENDER.camera.updateProjectionMatrix();


    RENDER.camera_ortho.aspect = RENDER.aspect;
    let a = RENDER.scale*RENDER.aspect;
    RENDER.camera_ortho.left   = -a;
	RENDER.camera_ortho.right  = a;
	RENDER.camera_ortho.top    = RENDER.scale;
	RENDER.camera_ortho.bottom = -RENDER.scale;
    RENDER.camera_ortho.updateProjectionMatrix();

}

function render_fullscreen(){
    if ( !document.fullscreenEnabled ) { return; }
    if ( document.fullscreenElement ) {
        //if (document.exitFullscreen) {
	       document.exitFullscreen();
        //}
    }else{
        //if (document.body.requestFullscreen) {
	       document.body.requestFullscreen();
        //}
    }
}

// Подготовка рендера
function render_prepare(){
    RENDER.canvas   = document.getElementById('CANVAS');
    RENDER.renderer = new THREE.WebGLRenderer({canvas:RENDER.canvas, antialias:true, /*preserveDrawingBuffer: false, logarithmicDepthBuffer:true,*/ precision:'lowp' }); //lowp
    //RENDER.renderer.setPixelRatio( window.devicePixelRatio );
    //RENDER.renderer.shadowMap.enabled = false;
    
    RENDER.camera = new THREE.PerspectiveCamera( 45, RENDER.WIDTH/RENDER.HEIGHT, 0.1, 100 );
	
    RENDER.camera_ortho = new THREE.OrthographicCamera( -RENDER.scale*RENDER.aspect, RENDER.scale*RENDER.aspect, RENDER.scale, -RENDER.scale, 0.01, 1000 );
    //
	RENDER.controls = new THREE.OrbitControls( RENDER.camera );
    //
    RENDER.scene = new THREE.Scene();
    //RENDER.background = new THREE.TextureLoader().load('i/bg.jpg');
    //RENDER.scene.background = RENDER.background;
    // ---------------------
    // Обновляет размеры канвы при изменении размеров окна браузера
    window.addEventListener('resize', renderResize) ;
    //
    RENDER.lastframe_time = performance.now();
    //
    renderResize();
    //
}

function stop_animate(){
    cancelAnimationFrame(RENDER.animframeID);
    RENDER.renderer.clear();
}

function animate(){
    RENDER.animframeID = requestAnimationFrame(animate);
    let delta = performance.now() - RENDER.lastframe_time;
    RENDER.lastframe_time = performance.now();
    
    for ( let i = 0; i < RENDER.mixers.length; i++ ) {
       	RENDER.mixers[ i ].update( delta*0.001 );
	}

    RENDER.controls.update()
    
    RENDER.renderer.render( RENDER.scene, RENDER.camera );
}

